import os

import streamlit as st
from dotenv import load_dotenv

from api_client import APIClient, APIClientError
from components.auth import render_auth_gate

load_dotenv()

st.set_page_config(page_title="AI Career Copilot", layout="wide")

if "token" not in st.session_state:
    st.title("AI Career Copilot")
    api_url = os.getenv("API_URL", "http://localhost:8000").rstrip("/")
    try:
        health = APIClient().health()
        if health.get("status") == "ok":
            st.success("Backend connected")
        else:
            st.warning(f"Backend reachable but degraded: {health}")
    except APIClientError as exc:
        st.error(f"Cannot reach backend at {api_url}: {exc}")
    render_auth_gate()
    st.stop()

st.sidebar.title("AI Career Copilot")
st.sidebar.write(f"Signed in as **{st.session_state.get('user_name', 'User')}**")
if st.sidebar.button("Logout"):
    for key in ("token", "user_name", "user_email"):
        st.session_state.pop(key, None)
    st.rerun()

st.title("Welcome")
st.write(
    "Use the sidebar pages to complete onboarding in **Settings**, then review pipeline status."
)
