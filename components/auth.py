import streamlit as st

from api_client import APIClient, APIClientError


def render_login() -> None:
    """Render the email/password login form."""
    st.subheader("Login")
    st.caption("Use the seeded dashboard credentials from your `.env` file.")

    with st.form("login_form"):
        email = st.text_input("Email")
        password = st.text_input("Password", type="password")
        submitted = st.form_submit_button("Login")

    if submitted:
        client = APIClient()
        try:
            result = client.login(email.strip(), password)
            st.session_state["token"] = result["token"]
            st.session_state["user_name"] = result["name"]
            st.session_state["user_email"] = result["email"]
            st.rerun()
        except APIClientError as exc:
            st.error(str(exc))


def require_login() -> APIClient | None:
    """Ensure the user is authenticated before showing dashboard pages."""
    if "token" not in st.session_state:
        render_login()
        return None
    return APIClient(st.session_state["token"])
