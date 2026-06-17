import time
from datetime import date

import pandas as pd
import streamlit as st

from api_client import APIClientError
from components.layout import page_setup

client = page_setup("Pipeline Status")
if client is None:
    raise SystemExit

try:
    profile = client.get_profile()
except APIClientError as exc:
    st.error(str(exc))
    st.stop()

POLL_INTERVAL_SECONDS = 5


def _find_run(runs: list[dict], run_id: str | None) -> dict | None:
    if run_id:
        for run in runs:
            if run.get("id") == run_id:
                return run
    today = date.today().isoformat()
    for run in runs:
        if run.get("run_date") == today:
            return run
    return None


st.subheader("Manual Pipeline Trigger")
has_resume = bool(profile.get("has_active_resume"))
if st.button("Run Pipeline Now", disabled=not has_resume):
    with st.spinner("Starting pipeline..."):
        try:
            result = client.run_pipeline()
            st.session_state["pipeline_run_id"] = result.get("id")
            st.session_state["pipeline_poll_active"] = True
        except APIClientError as exc:
            st.error(str(exc))

if not has_resume:
    st.warning("Upload a resume in Settings before triggering the pipeline.")

if st.session_state.get("pipeline_poll_active"):
    try:
        runs_payload = client.get_pipeline_runs()
        run = _find_run(runs_payload.get("runs", []), st.session_state.get("pipeline_run_id"))
    except APIClientError as exc:
        st.error(str(exc))
        st.session_state.pop("pipeline_poll_active", None)
        run = None

    if run and run.get("status") == "running":
        st.info("Pipeline is running — fetching jobs from ~250 boards may take several minutes.")
        time.sleep(POLL_INTERVAL_SECONDS)
        st.rerun()
    elif run:
        status = run.get("status")
        if status in ("success", "partial"):
            st.success(
                f"Pipeline finished with status **{status}** — "
                f"{run.get('jobs_scored', 0)} jobs scored."
            )
        else:
            st.error(
                f"Pipeline finished with status **{status}** — "
                f"{run.get('error_message') or 'see run history below.'}"
            )
        st.session_state.pop("pipeline_poll_active", None)
        st.session_state.pop("pipeline_run_id", None)
        time.sleep(1)
        st.rerun()

st.subheader("LLM Usage")
try:
    usage = client.get_llm_usage()
    cols = st.columns(4)
    cols[0].metric("Total calls", usage.get("total_calls", 0))
    cols[1].metric("Prompt tokens", usage.get("total_prompt_tokens", 0))
    cols[2].metric("Completion tokens", usage.get("total_completion_tokens", 0))
    cols[3].metric("Est. cost (USD)", f"${usage.get('estimated_cost_usd', 0):.4f}")
except APIClientError as exc:
    st.error(str(exc))

st.subheader("Recent Runs")
try:
    runs_payload = client.get_pipeline_runs()
except APIClientError as exc:
    st.error(str(exc))
    st.stop()

runs = runs_payload.get("runs", [])
if not runs:
    st.info("No pipeline runs recorded yet.")
else:
    df = pd.DataFrame(
        [
            {
                "date": run.get("run_date"),
                "status": run.get("status"),
                "discovered": run.get("jobs_discovered"),
                "after dedup": run.get("jobs_after_dedup"),
                "scored": run.get("jobs_scored"),
                "top (≥70)": run.get("top_opportunities"),
                "started": run.get("started_at"),
                "completed": run.get("completed_at"),
                "error stage": run.get("error_stage"),
                "error": run.get("error_message"),
            }
            for run in runs
        ]
    )
    st.dataframe(df, use_container_width=True, hide_index=True)

    failed = [run for run in runs if run.get("status") == "failed"]
    if failed:
        st.error("Most recent failure")
        last_failed = failed[0]
        st.write(
            f"{last_failed.get('run_date')}: stage **{last_failed.get('error_stage')}** — "
            f"{last_failed.get('error_message')}"
        )
