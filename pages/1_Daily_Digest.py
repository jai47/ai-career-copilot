import streamlit as st

from api_client import APIClientError
from components.layout import page_setup
from components.opportunity_card import render_opportunity_card

client = page_setup("Daily Digest")
if client is None:
    raise SystemExit

try:
    digest = client.get_today_digest()
except APIClientError as exc:
    if exc.code == "NOT_FOUND":
        st.info("No digest for today yet. Run the pipeline from Pipeline Status.")
    else:
        st.error(str(exc))
    digest = None

if digest:
    st.subheader(f"Digest — {digest.get('digest_date')}")
    st.text(digest.get("content_text", ""))

st.subheader("Today's Opportunities")
try:
    opportunities = client.list_opportunities(min_score=60, page_size=50)
except APIClientError as exc:
    st.error(str(exc))
    st.stop()

items = opportunities.get("items", [])
if not items:
    st.info("No scored opportunities with score ≥ 60 yet.")
else:
    for item in items:
        render_opportunity_card(client, item, key_prefix="digest")
