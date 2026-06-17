"""Shared page setup: auth gate and pipeline health banner."""

from __future__ import annotations

import streamlit as st

from api_client import APIClient
from components.auth import require_login
from components.health_banner import render_health_banner


def page_setup(title: str, *, layout: str = "wide") -> APIClient | None:
    """Configure the page, require login, and show the health banner."""
    st.set_page_config(page_title=title, layout=layout)
    st.title(title)
    client = require_login()
    if client is None:
        st.stop()
    render_health_banner(client)
    return client
