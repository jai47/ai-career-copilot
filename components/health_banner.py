"""Pipeline health banner shown on every authenticated page."""

from __future__ import annotations

from datetime import date

import streamlit as st

from api_client import APIClient, APIClientError


def render_health_banner(client: APIClient) -> None:
    """Show pipeline failure or stale-run warnings."""
    try:
        payload = client.get_pipeline_runs()
        runs = payload.get("runs", [])
    except APIClientError as exc:
        st.warning(f"Could not load pipeline status: {exc}")
        return

    if not runs:
        st.warning("Pipeline has not run yet. Check Pipeline Status page.")
        return

    last_run = runs[0]
    status = last_run.get("status")
    run_date_raw = last_run.get("run_date")
    run_date = date.fromisoformat(run_date_raw) if run_date_raw else None

    if status == "failed":
        st.error(
            f"Pipeline {run_date_raw}: FAILED at stage "
            f"'{last_run.get('error_stage')}'. {last_run.get('error_message')}"
        )
    elif status == "partial":
        st.warning(
            f"Pipeline {run_date_raw}: completed with errors. "
            f"{last_run.get('error_message') or 'See Pipeline Status for details.'}"
        )
    elif run_date is None or run_date < date.today():
        st.warning("Pipeline has not run today. Check Pipeline Status page.")
