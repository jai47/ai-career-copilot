"""Reusable opportunity card with approve/reject/skip actions."""

from __future__ import annotations

import streamlit as st

from api_client import APIClient, APIClientError

REJECT_OPTIONS = {
    "company": "This company",
    "role": "This role type",
    "location": "This location",
    "other": "Other",
}


def render_opportunity_card(client: APIClient, opportunity: dict, *, key_prefix: str) -> None:
    """Render one opportunity card with action buttons."""
    score = opportunity.get("overall_score", 0)
    classification = opportunity.get("classification", "")
    feedback = opportunity.get("user_feedback")
    optional = 60 <= (score or 0) < 70

    header = (
        f"**{opportunity.get('title')}** @ {opportunity.get('company')} "
        f"({opportunity.get('country') or '??'})"
    )
    if optional:
        st.markdown(f"{header} — _optional_")
    else:
        st.markdown(header)

    if opportunity.get("is_stale"):
        st.warning("⚠ Posting may be closed")

    cols = st.columns([2, 2, 2, 2, 3])
    cols[0].metric("Score", f"{score:.1f}" if score is not None else "—")
    cols[1].write(opportunity.get("visa_status") or "—")
    cols[2].write(opportunity.get("salary_display") or "Not listed")
    cols[3].write(classification or "—")
    cols[4].write(f"Status: {feedback or 'pending'}")

    if feedback:
        return

    action_cols = st.columns([1, 2, 1, 2])
    if action_cols[0].button("Approve", key=f"{key_prefix}-approve-{opportunity['id']}"):
        try:
            client.approve_opportunity(opportunity["id"])
            st.success("Approved — tailored resume generated.")
            st.rerun()
        except APIClientError as exc:
            st.error(str(exc))

    if action_cols[1].button("Skip", key=f"{key_prefix}-skip-{opportunity['id']}"):
        try:
            client.skip_opportunity(opportunity["id"])
            st.info("Skipped.")
            st.rerun()
        except APIClientError as exc:
            st.error(str(exc))

    reject_reason = action_cols[3].selectbox(
        "Reject reason",
        options=list(REJECT_OPTIONS.keys()),
        format_func=lambda key: REJECT_OPTIONS[key],
        key=f"{key_prefix}-reject-select-{opportunity['id']}",
        label_visibility="collapsed",
    )
    if action_cols[2].button("Reject", key=f"{key_prefix}-reject-{opportunity['id']}"):
        try:
            client.reject_opportunity(opportunity["id"], reject_reason)
            st.warning("Rejected and blacklist updated where applicable.")
            st.rerun()
        except APIClientError as exc:
            st.error(str(exc))

    st.divider()
