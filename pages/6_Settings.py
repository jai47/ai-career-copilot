import streamlit as st

from api_client import APIClientError
from components.auth import require_login
from components.constants import COUNTRY_OPTIONS, SALARY_CURRENCIES, TARGET_ROLES

st.set_page_config(page_title="Settings", layout="wide")
st.title("Settings")

client = require_login()
if client is None:
    st.stop()

try:
    profile = client.get_profile()
    llm_status = client.llm_status()
except APIClientError as exc:
    st.error(str(exc))
    st.stop()

step_labels = ["1. Upload Resume", "2. Preferences", "3. API Keys"]
tabs = st.tabs(step_labels)

with tabs[0]:
    st.subheader("Upload Master Resume")
    st.caption("Upload a `.pdf` or `.docx` resume. The backend extracts text and parses skills once.")

    if profile.get("has_active_resume"):
        st.success("Active resume on file.")
        if profile.get("parsed_skills"):
            st.write("Parsed skills:", ", ".join(profile["parsed_skills"]))

    uploaded = st.file_uploader("Resume file", type=["pdf", "docx"])
    if uploaded is not None and st.button("Upload and Parse Resume", key="upload_resume"):
        with st.spinner("Uploading and parsing resume..."):
            try:
                result = client.upload_resume(uploaded.name, uploaded.getvalue())
                st.success(f"Resume uploaded: {result['filename']}")
                st.write("Skills:", ", ".join(result.get("skills", [])))
                st.rerun()
            except APIClientError as exc:
                st.error(str(exc))

with tabs[1]:
    st.subheader("Job Preferences")

    nationality_options = ["", *COUNTRY_OPTIONS.keys()]
    nationality_labels = ["Not set", *[COUNTRY_OPTIONS[code] for code in COUNTRY_OPTIONS]]
    current_nationality = profile.get("nationality") or ""
    nationality_index = nationality_options.index(current_nationality) if current_nationality in nationality_options else 0

    preferred_countries = st.multiselect(
        "Preferred countries (empty = all countries)",
        options=list(COUNTRY_OPTIONS.keys()),
        default=profile.get("preferred_countries", []),
        format_func=lambda code: f"{code} — {COUNTRY_OPTIONS[code]}",
    )
    preferred_roles = st.multiselect(
        "Preferred roles",
        options=TARGET_ROLES,
        default=profile.get("preferred_roles", []),
    )
    nationality = st.selectbox(
        "Nationality (home country for visa scoring bypass)",
        options=nationality_options,
        index=nationality_index,
        format_func=lambda code: "Not set" if not code else f"{code} — {COUNTRY_OPTIONS[code]}",
    )
    years_experience = st.number_input(
        "Years of experience",
        min_value=0,
        max_value=50,
        value=int(profile.get("years_experience") or 0),
    )
    prefers_remote = st.toggle("Prefer remote roles", value=bool(profile.get("prefers_remote")))
    salary_currency = st.selectbox(
        "Salary currency",
        options=SALARY_CURRENCIES,
        index=SALARY_CURRENCIES.index(profile.get("salary_currency", "USD")),
    )
    salary_range_min = st.number_input(
        "Minimum acceptable annual salary (optional)",
        min_value=0,
        value=int(profile["salary_range_min"]) if profile.get("salary_range_min") is not None else 0,
    )
    salary_range_max = st.number_input(
        "Target / desired annual salary (optional)",
        min_value=0,
        value=int(profile["salary_range_max"]) if profile.get("salary_range_max") is not None else 0,
    )

    if st.button("Save Preferences", key="save_preferences"):
        payload = {
            "nationality": nationality or None,
            "preferred_countries": preferred_countries,
            "preferred_roles": preferred_roles,
            "years_experience": years_experience,
            "prefers_remote": prefers_remote,
            "salary_currency": salary_currency,
            "salary_range_min": salary_range_min or None,
            "salary_range_max": salary_range_max or None,
        }
        try:
            client.update_profile(payload)
            st.success("Preferences saved.")
            st.rerun()
        except APIClientError as exc:
            st.error(str(exc))

with tabs[2]:
    st.subheader("LLM API Keys")
    st.caption(
        "API keys are configured in `.env` at deploy time. "
        "The dashboard only shows whether each provider is configured."
    )

    anthropic_ok = llm_status.get("anthropic_configured")
    openai_ok = llm_status.get("openai_configured")

    if anthropic_ok:
        st.success("Anthropic API key configured")
    else:
        st.warning("Anthropic API key missing")

    if openai_ok:
        st.success("OpenAI API key configured")
    else:
        st.info("OpenAI fallback key not configured")

    if not profile.get("has_active_resume"):
        st.warning("Upload a resume before running the pipeline.")
