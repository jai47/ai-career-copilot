import streamlit as st

from components.auth import require_login

st.set_page_config(page_title="Opportunities", layout="wide")
st.title("Opportunities")

client = require_login()
if client is None:
    st.stop()

st.info("Opportunities table is implemented in Phase 12.")

