import streamlit as st

from api_client import APIClientError
from components.layout import page_setup

client = page_setup("Resume Versions")
if client is None:
    raise SystemExit

try:
    payload = client.list_resume_versions()
    llm_status = client.llm_status()
except APIClientError as exc:
    st.error(str(exc))
    st.stop()

llm_configured = any(
    llm_status.get(key)
    for key in (
        "anthropic_configured",
        "openai_configured",
        "opencode_configured",
        "local_llm_configured",
    )
)
if not llm_configured:
    st.warning(
        "**No LLM API key configured** — resumes are formatted locally, not AI-rewritten. "
        "Add `OPENCODE_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY` in `.env` and restart "
        "for AI tailoring and LaTeX layout."
    )

versions = payload.get("versions", [])
if not versions:
    st.info(
        "No tailored resumes yet. Go to **Daily Digest**, find a job you like, "
        "and click **Approve** — a resume version is created for that role."
    )
    st.stop()

labels = [
    f"{version['job_title']} @ {version['company']} ({version.get('created_at', '')[:10]})"
    for version in versions
]
selected_index = st.selectbox("Select resume version", range(len(labels)), format_func=lambda i: labels[i])
version = versions[selected_index]

if version.get("ai_tailored"):
    st.success("Content: **AI-tailored** for this job")
else:
    st.warning(
        "Content: **local formatting only** (not AI-rewritten). "
        "Configure an LLM key in Settings → API Keys, then approve a new job."
    )

if version.get("pdf_engine") == "latex":
    st.caption("PDF engine: LaTeX (tectonic) — professional single-page layout")
else:
    st.warning(
        "PDF engine: HTML fallback — install **tectonic** (`brew install tectonic`) "
        "or use Docker for proper LaTeX PDFs."
    )

score_cols = st.columns(3)
score_cols[0].metric("ATS before", version.get("ats_score_before") or "—")
score_cols[1].metric("ATS after", version.get("ats_score_after") or "—")
score_cols[2].write(
    "Keywords added: "
    + (", ".join(version.get("keywords_added") or []) or "—")
)

if version.get("skill_gaps"):
    st.info("Notes: " + ", ".join(version["skill_gaps"]))

left, right = st.columns(2)
with left:
    st.subheader("Master Resume")
    st.text_area(
        "master",
        value=version.get("master_text") or "(no master resume text)",
        height=400,
        disabled=True,
        label_visibility="collapsed",
    )
with right:
    st.subheader("Tailored Version")
    st.text_area(
        "tailored",
        value=version.get("tailored_markdown") or "(no tailored content)",
        height=400,
        disabled=True,
        label_visibility="collapsed",
    )

st.subheader("LaTeX (single-page PDF source)")
st.text_area(
    "latex",
    value=version.get("latex_source") or "(generated when you download PDF)",
    height=300,
    disabled=True,
    label_visibility="collapsed",
)

if version.get("tailored_markdown"):
    if st.button("Generate / refresh PDF", key=f"pdf-{version['id']}"):
        with st.spinner("Building LaTeX and compiling PDF..."):
            try:
                pdf_bytes = client.download_resume_pdf(version["id"])
            except APIClientError as exc:
                st.error(f"PDF download failed: {exc}")
            else:
                st.session_state[f"pdf_bytes_{version['id']}"] = pdf_bytes
                st.success("PDF ready.")
                st.rerun()

    pdf_bytes = st.session_state.get(f"pdf_bytes_{version['id']}")
    if pdf_bytes:
        st.download_button(
            "Download PDF",
            data=pdf_bytes,
            file_name=f"resume-{version['company']}.pdf",
            mime="application/pdf",
        )
