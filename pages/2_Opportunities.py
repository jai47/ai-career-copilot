from datetime import date

import pandas as pd
import streamlit as st

from api_client import APIClientError
from components.layout import page_setup

client = page_setup("Opportunities")
if client is None:
    raise SystemExit

if "selected_opportunity_id" not in st.session_state:
    st.session_state["selected_opportunity_id"] = None

with st.sidebar:
    st.subheader("Filters")
    country = st.text_input("Country (ISO-2)", value="").upper() or None
    visa_status = st.selectbox(
        "Visa status",
        options=["", "available", "likely", "unknown", "unlikely", "none"],
        format_func=lambda value: value or "Any",
    ) or None
    classification = st.selectbox(
        "Classification",
        options=[
            "",
            "apply_immediately",
            "high_priority",
            "apply",
            "optional",
            "skip",
        ],
        format_func=lambda value: value or "Any",
    ) or None
    min_score = st.slider("Minimum score", min_value=0, max_value=100, value=0)
    use_date_filter = st.checkbox("Filter by digest date")
    date_from = None
    date_to = None
    if use_date_filter:
        date_from = st.date_input("From", value=date.today())
        date_to = st.date_input("To", value=date.today())
    page = st.number_input("Page", min_value=1, value=1)

try:
    result = client.list_opportunities(
        page=page,
        page_size=25,
        country=country,
        visa_status=visa_status,
        classification=classification,
        min_score=min_score if min_score > 0 else None,
        date_from=date_from,
        date_to=date_to,
    )
except APIClientError as exc:
    st.error(str(exc))
    st.stop()

items = result.get("items", [])
st.caption(f"Showing {len(items)} of {result.get('total', 0)} opportunities")

if items:
    df = pd.DataFrame(
        [
            {
                "id": item["id"],
                "company": item["company"],
                "title": item["title"],
                "country": item.get("country"),
                "score": item.get("overall_score"),
                "visa": item.get("visa_status"),
                "classification": item.get("classification"),
                "feedback": item.get("user_feedback") or "pending",
                "date": item.get("digest_date"),
            }
            for item in items
        ]
    )
    st.dataframe(df.drop(columns=["id"]), use_container_width=True, hide_index=True)

    selected_id = st.selectbox(
        "View details",
        options=[item["id"] for item in items],
        format_func=lambda oid: next(
            f"{item['title']} @ {item['company']}" for item in items if item["id"] == oid
        ),
    )
    if selected_id:
        try:
            detail = client.get_opportunity(selected_id)
        except APIClientError as exc:
            st.error(str(exc))
        else:
            st.subheader(f"{detail['title']} @ {detail['company']}")
            if detail.get("is_stale"):
                st.warning("⚠ Posting may be closed")
            st.write(
                f"Score: **{detail.get('overall_score')}** | "
                f"Visa: **{detail.get('visa_status')}** | "
                f"Classification: **{detail.get('classification')}**"
            )
            st.markdown("**Fit reasoning**")
            st.write(detail.get("fit_reasoning") or "—")
            st.markdown("**Visa reasoning**")
            st.write(detail.get("visa_reasoning") or "—")
            st.markdown("**Description**")
            st.write(detail.get("description") or "No description available.")
            if detail.get("url"):
                st.link_button("Open job posting", detail["url"])
else:
    st.info("No opportunities match your filters.")
