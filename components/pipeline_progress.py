"""Live pipeline progress display for Pipeline Status."""

from __future__ import annotations

import streamlit as st

STAGE_ORDER = [
    "starting",
    "discover",
    "deduplicate",
    "store_jobs",
    "score",
    "liveness",
    "company_universe",
    "digest",
    "skill_gap",
    "complete",
]

STAGE_LABELS = {
    "starting": "Starting",
    "discover": "Discovering jobs",
    "deduplicate": "Deduplicating",
    "store_jobs": "Storing jobs",
    "score": "Scoring",
    "liveness": "Liveness checks",
    "company_universe": "Company universe",
    "digest": "Daily digest",
    "skill_gap": "Skill gap report",
    "complete": "Complete",
}


def _stage_index(stage: str | None) -> int:
    if not stage:
        return -1
    try:
        return STAGE_ORDER.index(stage)
    except ValueError:
        return -1


def render_pipeline_progress(run: dict) -> None:
    """Render stage stepper, live metrics, and scrollable log output."""
    current_stage = run.get("current_stage")
    status = run.get("status")
    stage_idx = _stage_index(current_stage)

    st.markdown(f"**Current stage:** {STAGE_LABELS.get(current_stage, current_stage or '—')}")

    cols = st.columns(len(STAGE_ORDER))
    for index, stage_code in enumerate(STAGE_ORDER):
        label = STAGE_LABELS[stage_code]
        if status != "running" and stage_code == "complete" and status in ("success", "partial", "failed"):
            symbol = "✅" if status in ("success", "partial") else "❌"
        elif index < stage_idx:
            symbol = "✅"
        elif index == stage_idx and status == "running":
            symbol = "▶️"
        else:
            symbol = "⬜"
        cols[index].caption(f"{symbol} {label}")

    metric_cols = st.columns(4)
    metric_cols[0].metric("Discovered", run.get("jobs_discovered", 0))
    metric_cols[1].metric("After dedup", run.get("jobs_after_dedup", 0))
    metric_cols[2].metric("Scored", run.get("jobs_scored", 0))
    metric_cols[3].metric(f"Top (≥{30})", run.get("top_opportunities", 0))

    logs = run.get("progress_log") or []
    if logs:
        lines = []
        for entry in logs:
            ts = (entry.get("ts") or "")[11:19]
            level = entry.get("level", "info").upper()
            stage = entry.get("stage", "")
            message = entry.get("message", "")
            lines.append(f"[{ts}] [{level}] [{stage}] {message}")
        st.text_area(
            "Pipeline log",
            value="\n".join(lines),
            height=320,
            disabled=True,
            label_visibility="collapsed",
        )
    else:
        st.caption("Waiting for pipeline log output...")
