import streamlit as st

from components.auth import require_login

st.set_page_config(page_title="Application Tracker", layout="wide")
st.title("Application Tracker")

client = require_login()
if client is None:
    st.stop()

st.info("Application tracker is implemented in Phase 12.")

