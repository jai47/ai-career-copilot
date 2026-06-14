import streamlit as st

from components.auth import require_login

st.set_page_config(page_title="Daily Digest", layout="wide")
st.title("Daily Digest")

client = require_login()
if client is None:
    st.stop()

st.info("Daily digest view is implemented in Phase 12.")

