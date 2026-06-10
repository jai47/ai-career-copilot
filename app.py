import os

import requests
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(page_title="AI Career Copilot", layout="wide")
st.title("AI Career Copilot")

api_url = os.getenv("API_URL", "http://localhost:8000").rstrip("/")

try:
    response = requests.get(f"{api_url}/health", timeout=10)
    response.raise_for_status()
    payload = response.json()
    if payload.get("status") == "ok" and payload.get("db") == "connected":
        st.success("Backend connected")
    else:
        st.warning(f"Backend reachable but degraded: {payload}")
except requests.RequestException as exc:
    st.error(f"Cannot reach backend at {api_url}: {exc}")
