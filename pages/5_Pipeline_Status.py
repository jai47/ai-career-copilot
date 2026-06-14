import streamlit as st

from api_client import APIClientError
from components.auth import require_login

st.set_page_config(page_title="Pipeline Status", layout="wide")
st.title("Pipeline Status")

client = require_login()
if client is None:
    st.stop()

try:
    profile = client.get_profile()
except APIClientError as exc:
    st.error(str(exc))
    st.stop()

st.subheader("Manual Pipeline Trigger")
st.caption("The nightly pipeline is blocked until you upload an active master resume.")

has_resume = bool(profile.get("has_active_resume"))
st.button(
    "Run Pipeline Now",
    disabled=not has_resume,
    help="Upload a resume in Settings before triggering the pipeline.",
)

if not has_resume:
    st.warning("Pipeline trigger is disabled until an active resume exists.")
else:
    st.info("Pipeline orchestration is implemented in Phase 11. The button will be wired then.")

st.subheader("Recent Runs")
st.write("Pipeline run history will appear here in Phase 11.")
