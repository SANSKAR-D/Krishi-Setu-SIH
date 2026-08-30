from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable

import requests


class AgmarknetError(RuntimeError):
    pass


@dataclass
class AgmarknetClient:
    base_url: str = "https://api.agmarknet.gov.in/v1"
    timeout: int = 30
    user_agent: str = (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
    )

    def __post_init__(self) -> None:
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Accept": "application/json, text/plain, */*",
                "Origin": "https://agmarknet.gov.in",
                "Referer": "https://agmarknet.gov.in/",
                "User-Agent": self.user_agent,
            }
        )

    def _url(self, path: str) -> str:
        return f"{self.base_url.rstrip('/')}/{path.lstrip('/')}"

    def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json: dict[str, Any] | None = None,
        expect_binary: bool = False,
    ) -> Any:
        response = self.session.request(
            method=method,
            url=self._url(path),
            params=params,
            json=json,
            timeout=self.timeout,
        )
        if not response.ok:
            raise AgmarknetError(
                f"Agmarknet request failed: {response.status_code} {response.text[:300]}"
            )
        if expect_binary:
            return {
                "content": response.content,
                "content_type": response.headers.get(
                    "content-type",
                    "application/octet-stream",
                ),
                "filename": _filename_from_headers(
                    response.headers.get("content-disposition")
                ),
            }
        if "application/json" in response.headers.get("content-type", ""):
            return response.json()
        return response.text

    def list_states(
        self,
        *,
        page: int = 1,
        search: str | None = None,
        status: int | None = None,
    ) -> dict[str, Any]:
        params: dict[str, Any] = {"page": page}
        if search:
            params["search"] = search
        if status is not None:
            params["status"] = status
        return self._request("GET", "/location/state", params=params)

    def commodity_market_daily_report_state(
        self,
        *,
        date: str,
        state_id: int | str,
        include_excel: bool = False,
    ) -> Any:
        return self._request(
            "GET",
            "/prices-and-arrivals/commodity-market/daily-report-state",
            params={
                "date": date,
                "state": state_id,
                "includeExcel": str(include_excel).lower(),
            },
            expect_binary=include_excel,
        )


def _filename_from_headers(content_disposition: str | None) -> str | None:
    if not content_disposition:
        return None
    for part in content_disposition.split(";"):
        part = part.strip()
        if part.startswith("filename="):
            return part.split("=", 1)[1].strip('"')
    return None
