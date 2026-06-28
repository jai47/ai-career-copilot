"""Typed HTTP wrapper for FastAPI."""

from __future__ import annotations

import os
import socket
from datetime import date
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv

# Load repo-root .env before reading API_URL (streamlit is often started from frontend/).
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def _resolve_api_url() -> str:
    """Return API base URL, falling back to localhost when Docker hostname is unreachable."""
    configured = os.getenv("API_URL", "http://localhost:8000").rstrip("/")
    host = configured.split("://", 1)[-1].split("/", 1)[0].split(":", 1)[0]
    if host == "api":
        try:
            socket.gethostbyname(host)
        except socket.gaierror:
            return "http://localhost:8000"
    return configured


API_URL = _resolve_api_url()


class APIClientError(Exception):
    """Raised when the API returns an error response."""

    def __init__(self, message: str, status_code: int | None = None, code: str | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code


class APIClient:
    """Minimal REST client for Streamlit pages."""

    def __init__(self, token: str | None = None) -> None:
        self.token = token

    def _headers(self) -> dict[str, str]:
        headers = {"Accept": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def _handle_response(self, response: requests.Response) -> Any:
        if response.ok:
            if not response.content:
                return None
            return response.json()

        payload: dict[str, Any] = {}
        try:
            payload = response.json()
        except ValueError:
            payload = {"error": response.text}

        raise APIClientError(
            payload.get("error", "Request failed"),
            status_code=response.status_code,
            code=payload.get("code"),
        )

    def get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        response = requests.get(
            f"{API_URL}{path}",
            headers=self._headers(),
            params=params,
            timeout=30,
        )
        return self._handle_response(response)

    def patch(self, path: str, payload: dict[str, Any]) -> Any:
        response = requests.patch(
            f"{API_URL}{path}",
            headers=self._headers(),
            json=payload,
            timeout=30,
        )
        return self._handle_response(response)

    def post(self, path: str, payload: dict[str, Any] | None = None, *, timeout: int = 120) -> Any:
        try:
            response = requests.post(
                f"{API_URL}{path}",
                headers=self._headers(),
                json=payload,
                timeout=timeout,
            )
        except requests.ConnectionError as exc:
            raise APIClientError(
                f"Cannot reach backend at {API_URL}. "
                "Is the API server running? For local dev, set API_URL=http://localhost:8000 in .env.",
                code="CONNECTION_ERROR",
            ) from exc
        except requests.Timeout as exc:
            raise APIClientError(
                "Request timed out. The server may still be processing — refresh Pipeline Status.",
                code="TIMEOUT",
            ) from exc
        return self._handle_response(response)

    def post_file(self, path: str, filename: str, content: bytes) -> Any:
        try:
            response = requests.post(
                f"{API_URL}{path}",
                headers={"Authorization": f"Bearer {self.token}"} if self.token else {},
                files={"file": (filename, content)},
                timeout=120,
            )
        except requests.ConnectionError as exc:
            raise APIClientError(
                f"Cannot reach backend at {API_URL}. "
                "Is the API server running? For local dev, set API_URL=http://localhost:8000 in .env.",
                code="CONNECTION_ERROR",
            ) from exc
        except requests.Timeout as exc:
            raise APIClientError(
                "Upload timed out. Try again or use a smaller resume file.",
                code="TIMEOUT",
            ) from exc
        return self._handle_response(response)

    def get_bytes(self, path: str) -> bytes:
        response = requests.get(
            f"{API_URL}{path}",
            headers=self._headers(),
            timeout=120,
        )
        if response.ok:
            return response.content
        payload: dict[str, Any] = {}
        try:
            payload = response.json()
        except ValueError:
            payload = {"error": response.text}
        raise APIClientError(
            payload.get("error", "Request failed"),
            status_code=response.status_code,
            code=payload.get("code"),
        )

    def login(self, email: str, password: str) -> dict[str, Any]:
        return self.post("/auth/login", {"email": email, "password": password})

    def auth_status(self) -> dict[str, Any]:
        return self.get("/auth/status")

    def setup_account(self, name: str, email: str, password: str) -> dict[str, Any]:
        return self.post(
            "/auth/setup",
            {"name": name, "email": email, "password": password},
        )

    def get_profile(self) -> dict[str, Any]:
        return self.get("/users/me")

    def update_profile(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self.patch("/users/me", payload)

    def upload_resume(self, filename: str, content: bytes) -> dict[str, Any]:
        return self.post_file("/users/me/resume", filename, content)

    def upload_resume_text(self, text: str) -> dict[str, Any]:
        return self.post("/users/me/resume/text", {"text": text}, timeout=180)

    def llm_status(self) -> dict[str, Any]:
        return self.get("/config/llm-status")

    def health(self) -> dict[str, Any]:
        return self.get("/health")

    def get_blacklists(self) -> dict[str, Any]:
        return self.get("/users/me/blacklists")

    def update_blacklists(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self.patch("/users/me/blacklists", payload)

    def get_today_digest(self) -> dict[str, Any]:
        return self.get("/digest/today")

    def list_opportunities(
        self,
        *,
        page: int = 1,
        page_size: int = 25,
        country: str | None = None,
        visa_status: str | None = None,
        classification: str | None = None,
        min_score: float | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> dict[str, Any]:
        params: dict[str, Any] = {"page": page, "page_size": page_size}
        if country:
            params["country"] = country
        if visa_status:
            params["visa_status"] = visa_status
        if classification:
            params["classification"] = classification
        if min_score is not None:
            params["min_score"] = min_score
        if date_from:
            params["date_from"] = date_from.isoformat()
        if date_to:
            params["date_to"] = date_to.isoformat()
        return self.get("/opportunities", params=params)

    def get_opportunity(self, opportunity_id: str) -> dict[str, Any]:
        return self.get(f"/opportunities/{opportunity_id}")

    def approve_opportunity(self, opportunity_id: str) -> dict[str, Any]:
        return self.post(f"/opportunities/{opportunity_id}/approve")

    def reject_opportunity(self, opportunity_id: str, reason: str) -> dict[str, Any]:
        return self.post(f"/opportunities/{opportunity_id}/reject", {"reason": reason})

    def skip_opportunity(self, opportunity_id: str) -> dict[str, Any]:
        return self.post(f"/opportunities/{opportunity_id}/skip")

    def list_applications(self) -> dict[str, Any]:
        return self.get("/applications")

    def update_application(self, application_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        return self.patch(f"/applications/{application_id}", payload)

    def list_resume_versions(self) -> dict[str, Any]:
        return self.get("/resume-versions")

    def download_resume_pdf(self, version_id: str) -> bytes:
        return self.get_bytes(f"/resume-versions/{version_id}/pdf")

    def get_pipeline_runs(self) -> dict[str, Any]:
        return self.get("/pipeline/runs")

    def run_pipeline(self) -> dict[str, Any]:
        return self.post("/pipeline/run", timeout=30)

    def get_llm_usage(self) -> dict[str, Any]:
        return self.get("/pipeline/llm-usage")

    def get_skill_gap_reports(self) -> dict[str, Any]:
        return self.get("/reports/skill-gap")
