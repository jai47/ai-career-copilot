import streamlit as st

from api_client import APIClientError
from components.constants import COUNTRY_OPTIONS, SALARY_CURRENCIES, TARGET_ROLES
from components.layout import page_setup

client = page_setup("Settings")
if client is None:
    raise SystemExit

try:
    profile = client.get_profile()
    llm_status = client.llm_status()
    blacklists = client.get_blacklists()
except APIClientError as exc:
    st.error(str(exc))
    st.stop()

tabs = st.tabs(
    ["1. Upload Resume", "2. Preferences", "3. Blacklists", "4. API Keys", "5. Skill Gap"]
)


def _normalize_multiselect_defaults(values: list[str], options: list[str]) -> list[str]:
    """Map profile values onto widget options (case-insensitive), dropping unknowns."""
    lookup = {option.lower(): option for option in options}
    normalized: list[str] = []
    for value in values or []:
        canonical = lookup.get(value.lower())
        if canonical and canonical not in normalized:
            normalized.append(canonical)
    return normalized

with tabs[0]:
    st.subheader("Upload Master Resume")
    st.caption(
        "The backend extracts text and parses skills once. "
        "If file upload shows **AxiosError: Network Error**, use the paste option below "
        "(common in embedded browsers or when not using `http://localhost:8501`)."
    )

    if profile.get("has_active_resume"):
        st.success("Active resume on file.")
        if profile.get("parsed_skills"):
            st.write("Parsed skills:", ", ".join(profile["parsed_skills"]))
        else:
            st.warning(
                "No skills were detected in your resume. "
                "Re-upload with a clear Skills section, or run the pipeline anyway — "
                "scores may be lower until skills are parsed."
            )

    st.markdown("**Option A — paste resume text** (recommended if file upload fails)")
    pasted_resume = st.text_area(
        "Resume text",
        height=220,
        placeholder="Paste your full resume text here...",
        label_visibility="collapsed",
    )
    if st.button("Parse Pasted Resume", key="upload_resume_text", disabled=not pasted_resume.strip()):
        with st.spinner("Parsing resume with LLM..."):
            try:
                result = client.upload_resume_text(pasted_resume.strip())
                st.success(f"Resume saved: {result['filename']}")
                st.write("Skills:", ", ".join(result.get("skills", [])))
                st.rerun()
            except APIClientError as exc:
                st.error(str(exc))

    st.markdown("**Option B — upload `.pdf` or `.docx`**")
    st.caption("Open the app at http://localhost:8501 (not the Network URL) if this fails.")
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
    current_nationality = profile.get("nationality") or ""
    nationality_index = (
        nationality_options.index(current_nationality) if current_nationality in nationality_options else 0
    )

    preferred_countries = st.multiselect(
        "Preferred countries (empty = all countries)",
        options=list(COUNTRY_OPTIONS.keys()),
        default=_normalize_multiselect_defaults(
            profile.get("preferred_countries", []),
            list(COUNTRY_OPTIONS.keys()),
        ),
        format_func=lambda code: f"{code} — {COUNTRY_OPTIONS[code]}",
    )
    preferred_roles = st.multiselect(
        "Preferred roles",
        options=TARGET_ROLES,
        default=_normalize_multiselect_defaults(profile.get("preferred_roles", []), TARGET_ROLES),
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
    st.subheader("Blacklists")
    st.caption("Jobs matching these filters are removed before scoring on the next pipeline run.")

    companies = st.text_area(
        "Blacklisted companies (one per line)",
        value="\n".join(blacklists.get("blacklisted_companies", [])),
        height=120,
    )
    roles = st.text_area(
        "Blacklisted role patterns (one per line)",
        value="\n".join(blacklists.get("blacklisted_roles", [])),
        height=120,
    )
    locations = st.multiselect(
        "Blacklisted locations (ISO-2)",
        options=list(COUNTRY_OPTIONS.keys()),
        default=blacklists.get("blacklisted_locations", []),
        format_func=lambda code: f"{code} — {COUNTRY_OPTIONS[code]}",
    )

    if st.button("Save Blacklists", key="save_blacklists"):
        payload = {
            "blacklisted_companies": [line.strip() for line in companies.splitlines() if line.strip()],
            "blacklisted_roles": [line.strip() for line in roles.splitlines() if line.strip()],
            "blacklisted_locations": locations,
        }
        try:
            client.update_blacklists(payload)
            st.success("Blacklists saved.")
            st.rerun()
        except APIClientError as exc:
            st.error(str(exc))

with tabs[3]:
    st.subheader("LLM API Keys")
    st.caption(
        "API keys are configured in `.env` at deploy time. "
        "The dashboard only shows whether each provider is configured."
    )

    if llm_status.get("anthropic_configured"):
        st.success("Anthropic API key configured")
    else:
        st.warning("Anthropic API key missing")

    if llm_status.get("openai_configured"):
        st.success("OpenAI API key configured")
    else:
        st.info("OpenAI fallback key not configured")

    if llm_status.get("opencode_configured"):
        model = llm_status.get("opencode_model") or "default"
        st.success(f"OpenCode Zen API key configured (model: {model})")
    else:
        st.info("OpenCode Zen key not configured")

    if llm_status.get("local_llm_configured"):
        model = llm_status.get("local_llm_model") or "default"
        st.success(f"Local LLM configured (Ollama model: {model})")
    else:
        st.info("Local LLM not configured (set LOCAL_LLM_BASE_URL for free Ollama)")

    parser_mode = llm_status.get("resume_parser_mode", "auto")
    if parser_mode == "heuristic":
        st.success("Resume parser: free heuristic mode (no API)")
    elif parser_mode == "auto":
        st.info("Resume parser: auto (tries LLM, falls back to free heuristic)")
    else:
        st.warning("Resume parser: LLM only (requires paid API key)")

with tabs[4]:
    st.subheader("Skill Gap Reports")
    st.caption(
        "Skills required in jobs you're a reasonable fit for (fit score ≥ 50) "
        "but missing from your resume. Generated automatically on Fridays (weekly) "
        "and at month-end (monthly)."
    )
    try:
        reports = client.get_skill_gap_reports()
    except APIClientError as exc:
        st.error(str(exc))
    else:

        def _render_report(label: str, report: dict | None) -> None:
            st.markdown(f"**{label}**")
            if not report or not report.get("top_missing_skills"):
                st.info(f"No {label.lower()} report yet.")
                return
            st.caption(
                f"Period: {report.get('period_start', '—')} → {report.get('period_end', '—')} "
                f"({report.get('total_jobs_analysed', 0)} jobs analysed)"
            )
            rows = report["top_missing_skills"]
            st.dataframe(
                [
                    {
                        "Skill": row.get("skill"),
                        "Jobs": row.get("job_count"),
                        "Avg score": row.get("avg_score"),
                    }
                    for row in rows
                ],
                use_container_width=True,
                hide_index=True,
            )

        left, right = st.columns(2)
        with left:
            _render_report("Weekly", reports.get("weekly"))
        with right:
            _render_report("Monthly", reports.get("monthly"))

    if not profile.get("has_active_resume"):
        st.warning("Upload a resume before running the pipeline.")
