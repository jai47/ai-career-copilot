import streamlit as st

from components.auth import require_login

st.set_page_config(page_title="Resume Versions", layout="wide")
st.title("Resume Versions")

client = require_login()
if client is None:
    st.stop()

st.info("Resume versions view is implemented in Phase 13.")

