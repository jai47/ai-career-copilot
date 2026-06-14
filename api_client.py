"""Typed HTTP wrapper for FastAPI."""

from __future__ import annotations

import os
from typing import Any

import requests

API_URL = os.getenv("API_URL", "http://localhost:8000").rstrip("/")


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

    def get(self, path: str) -> Any:
        response = requests.get(f"{API_URL}{path}", headers=self._headers(), timeout=30)
        return self._handle_response(response)

    def patch(self, path: str, payload: dict[str, Any]) -> Any:
        response = requests.patch(
            f"{API_URL}{path}",
            headers=self._headers(),
            json=payload,
            timeout=30,
        )
        return self._handle_response(response)

    def post(self, path: str, payload: dict[str, Any] | None = None) -> Any:
        response = requests.post(
            f"{API_URL}{path}",
            headers=self._headers(),
            json=payload,
            timeout=30,
        )
        return self._handle_response(response)

    def post_file(self, path: str, filename: str, content: bytes) -> Any:
        response = requests.post(
            f"{API_URL}{path}",
            headers={"Authorization": f"Bearer {self.token}"} if self.token else {},
            files={"file": (filename, content)},
            timeout=120,
        )
        return self._handle_response(response)

    def login(self, email: str, password: str) -> dict[str, Any]:
        return self.post("/auth/login", {"email": email, "password": password})

    def get_profile(self) -> dict[str, Any]:
        return self.get("/users/me")

    def update_profile(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self.patch("/users/me", payload)

    def upload_resume(self, filename: str, content: bytes) -> dict[str, Any]:
        return self.post_file("/users/me/resume", filename, content)

    def llm_status(self) -> dict[str, Any]:
        return self.get("/config/llm-status")

    def health(self) -> dict[str, Any]:
        return self.get("/health")
