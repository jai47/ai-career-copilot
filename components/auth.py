import streamlit as st

from api_client import APIClient, APIClientError

_dialog = getattr(st, "dialog", None) or getattr(st, "experimental_dialog", None)


def _store_session(result: dict) -> None:
    st.session_state["token"] = result["token"]
    st.session_state["user_name"] = result["name"]
    st.session_state["user_email"] = result["email"]


def _render_first_user_form() -> None:
    """First-account setup form (used in modal or inline fallback)."""
    with st.form("setup_form"):
        name = st.text_input("Your name")
        email = st.text_input("Email")
        password = st.text_input("Password", type="password")
        confirm_password = st.text_input("Confirm password", type="password")
        submitted = st.form_submit_button("Create account", type="primary")

    if submitted:
        if not name.strip() or not email.strip():
            st.error("Name and email are required.")
            return
        if len(password) < 8:
            st.error("Password must be at least 8 characters.")
            return
        if password != confirm_password:
            st.error("Passwords do not match.")
            return

        client = APIClient()
        try:
            result = client.setup_account(name.strip(), email.strip(), password)
            _store_session(result)
            st.rerun()
        except APIClientError as exc:
            st.error(str(exc))


def _open_first_user_dialog() -> None:
    st.write(
        "Welcome to AI Career Copilot. Create the first account to secure your dashboard."
    )
    _render_first_user_form()


if _dialog is not None:
    _open_first_user_dialog = _dialog("Create your account")(_open_first_user_dialog)


def render_first_user_setup() -> None:
    """Show first-user setup as a dialog when supported, otherwise inline."""
    if _dialog is not None:
        _open_first_user_dialog()
        return

    st.subheader("Create your account")
    st.write(
        "Welcome to AI Career Copilot. Create the first account to secure your dashboard."
    )
    _render_first_user_form()


def render_login() -> None:
    """Render the email/password login form."""
    st.subheader("Login")
    st.caption("Sign in with your dashboard credentials.")

    with st.form("login_form"):
        email = st.text_input("Email")
        password = st.text_input("Password", type="password")
        submitted = st.form_submit_button("Login")

    if submitted:
        client = APIClient()
        try:
            result = client.login(email.strip(), password)
            _store_session(result)
            st.rerun()
        except APIClientError as exc:
            st.error(str(exc))


def render_auth_gate() -> None:
    """Show first-user setup or login depending on whether users exist."""
    client = APIClient()
    try:
        status = client.auth_status()
    except APIClientError as exc:
        st.error(f"Cannot check authentication status: {exc}")
        return

    if not status.get("has_users"):
        st.info("No accounts exist yet. Create the first one to get started.")
        render_first_user_setup()
        return

    render_login()


def require_login() -> APIClient | None:
    """Ensure the user is authenticated before showing dashboard pages."""
    if "token" not in st.session_state:
        render_auth_gate()
        return None
    return APIClient(st.session_state["token"])
