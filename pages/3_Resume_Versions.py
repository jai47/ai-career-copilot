import streamlit as st

from api_client import APIClientError
from components.layout import page_setup

client = page_setup("Resume Versions")
if client is None:
    raise SystemExit

try:
    payload = client.list_resume_versions()
except APIClientError as exc:
    st.error(str(exc))
    st.stop()

versions = payload.get("versions", [])
if not versions:
    st.info(
        "No tailored resumes yet. Go to **Daily Digest**, find a job you like, "
        "and click **Approve** — a resume version is created for that role. "
        "Without a paid LLM key, a copy of your master resume is saved instead of an AI-tailored version."
    )
    st.stop()

labels = [
    f"{version['job_title']} @ {version['company']} ({version.get('created_at', '')[:10]})"
    for version in versions
]
selected_index = st.selectbox("Select resume version", range(len(labels)), format_func=lambda i: labels[i])
version = versions[selected_index]

score_cols = st.columns(3)
score_cols[0].metric("ATS before", version.get("ats_score_before") or "—")
score_cols[1].metric("ATS after", version.get("ats_score_after") or "—")
score_cols[2].write(
    "Keywords added: "
    + (", ".join(version.get("keywords_added") or []) or "—")
)

if version.get("skill_gaps"):
    st.warning("Skill gaps: " + ", ".join(version["skill_gaps"]))

left, right = st.columns(2)
with left:
    st.subheader("Master Resume")
    st.text_area(
        "master",
        value=version.get("master_text") or "(no master resume text)",
        height=500,
        disabled=True,
        label_visibility="collapsed",
    )
with right:
    st.subheader("Tailored Version")
    st.text_area(
        "tailored",
        value=version.get("tailored_markdown") or "(no tailored content)",
        height=500,
        disabled=True,
        label_visibility="collapsed",
    )

if version.get("tailored_markdown"):
    try:
        pdf_bytes = client.download_resume_pdf(version["id"])
    except APIClientError as exc:
        st.error(f"PDF download failed: {exc}")
    else:
        st.download_button(
            "Download PDF",
            data=pdf_bytes,
            file_name=f"resume-{version['company']}.pdf",
            mime="application/pdf",
        )
