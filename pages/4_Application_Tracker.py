import streamlit as st

from api_client import APIClientError
from components.layout import page_setup

client = page_setup("Application Tracker")
if client is None:
    raise SystemExit

STATUS_COLUMNS = [
    ("approved", "Approved"),
    ("applied", "Applied"),
    ("interviewing", "Interviewing"),
    ("offer", "Offer"),
    ("accepted", "Accepted"),
    ("rejected", "Rejected"),
]

try:
    payload = client.list_applications()
except APIClientError as exc:
    st.error(str(exc))
    st.stop()

applications = payload.get("applications", [])
if not applications:
    st.info("No applications yet. Approve opportunities from the Daily Digest.")
    st.stop()

if "tracker_selected_id" not in st.session_state and applications:
    st.session_state["tracker_selected_id"] = applications[0]["id"]

selected_id = st.selectbox(
    "Select application",
    options=[app["id"] for app in applications],
    format_func=lambda app_id: next(
        f"{app['title']} @ {app['company']} ({app['status']})"
        for app in applications
        if app["id"] == app_id
    ),
    key="tracker_selected_id",
)
selected = next(app for app in applications if app["id"] == selected_id)

if selected.get("is_follow_up_overdue"):
    st.warning("Follow-up overdue (7 days).")
if selected.get("is_second_follow_up_overdue"):
    st.warning("Second follow-up overdue (14 days).")

st.subheader(f"{selected['title']} @ {selected['company']}")
status = st.selectbox(
    "Status",
    options=[code for code, _label in STATUS_COLUMNS],
    index=[code for code, _label in STATUS_COLUMNS].index(selected["status"]),
    format_func=lambda code: dict(STATUS_COLUMNS)[code],
)
notes = st.text_area("Notes", value=selected.get("notes") or "", height=120)

if st.button("Save changes", key="save_application"):
    try:
        client.update_application(selected_id, {"status": status, "notes": notes})
        st.success("Application updated.")
        st.rerun()
    except APIClientError as exc:
        st.error(str(exc))

st.divider()
st.subheader("Board")
cols = st.columns(len(STATUS_COLUMNS))
for index, (status_code, label) in enumerate(STATUS_COLUMNS):
    with cols[index]:
        st.markdown(f"**{label}**")
        column_apps = [app for app in applications if app["status"] == status_code]
        for app in column_apps:
            flag = ""
            if app.get("is_follow_up_overdue") or app.get("is_second_follow_up_overdue"):
                flag = " ⚠"
            if st.button(
                f"{app['company']}{flag}",
                key=f"board-{status_code}-{app['id']}",
                use_container_width=True,
            ):
                st.session_state["tracker_selected_id"] = app["id"]
                st.rerun()
