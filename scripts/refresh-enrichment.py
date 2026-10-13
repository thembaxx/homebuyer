"""Refresh official municipal evidence; validate everything before atomic publication.

No browser requests to Treasury are needed at runtime. Standard-library only.
Run with --check to fetch/validate without modifying the checked-in snapshot.
"""

import argparse
import datetime as dt
import hashlib
from html.parser import HTMLParser
import json
import math
import os
from pathlib import Path
import re
import tempfile
import time
import sys
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://municipalmoney.gov.za"
USER_AGENT = "HomeBuyerResearch/2.0 (public municipal evidence snapshot)"
METROS = {
    "CPT": "cape-town", "JHB": "city-of-johannesburg", "ETH": "ethekwini",
    "TSH": "city-of-tshwane", "BUF": "buffalo-city", "EKU": "city-of-ekurhuleni",
    "MAN": "mangaung", "NMA": "nelson-mandela-bay",
}
INDICATORS = {
    "cash_balance": "R", "cash_coverage": "months", "current_ratio": "ratio",
    "current_debtors_collection_rate": "%", "operating_budget_spending": "%",
    "capital_budget_spending": "%", "repairs_maintenance_spending": "%",
}
AUDIT_CODES = {
    "unqualified", "unqualified_emphasis_of_matter", "qualified", "adverse",
    "disclaimer", "outstanding",
}


class PageData(HTMLParser):
    def __init__(self):
        super().__init__()
        self.inside = False
        self.blocks = []
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == "script" and dict(attrs).get("id") == "page-data":
            self.inside = True
            self.blocks.append("")

    def handle_endtag(self, tag):
        if tag == "script":
            self.inside = False

    def handle_data(self, data):
        if self.inside:
            self.blocks[-1] += data
        else:
            self.parts.append(data)


def year(value, today):
    if isinstance(value, bool) or not re.fullmatch(r"\d{4}", str(value)):
        raise ValueError("Invalid reporting year")
    result = int(value)
    if result < 2000 or dt.date(result, 6, 30) > today:
        raise ValueError("Future or unsupported reporting period")
    return result


def safe_url(value):
    parsed = urllib.parse.urlparse(value)
    if parsed.scheme not in ("http", "https") or not parsed.hostname or parsed.username:
        raise ValueError("Invalid source URL")
    return value


def normalize_profile(data, code, today):
    geo = data["geography"]
    if geo["geo_code"] != code or geo["category"] != "A":
        raise ValueError("Profile does not match the requested metro")
    audits = []
    for row in data["audit_opinions"]["values"]:
        if row["rating"] not in AUDIT_CODES or not isinstance(row["result"], str):
            raise ValueError("Unknown audit opinion; review source taxonomy")
        audits.append({"year": year(row["date"], today), "code": row["rating"],
                       "label": row["result"],
                       "reportUrl": safe_url(row["report_url"]) if row.get("report_url") else None})
    if not audits:
        raise ValueError("Missing audit history")
    audits.sort(key=lambda row: row["year"], reverse=True)
    if len({row["year"] for row in audits}) != len(audits):
        raise ValueError("Duplicate audit reporting period")
    indicators = {}
    for key, unit in INDICATORS.items():
        series = data["indicators"][key]
        if series["result_type"] != unit:
            raise ValueError(f"Unexpected unit for {key}")
        values = []
        for row in series["values"]:
            value = row["result"]
            if value is not None and (isinstance(value, bool) or not isinstance(value, (float, int)) or not math.isfinite(value)):
                raise ValueError(f"Non-finite or non-numeric value in {key}")
            note = None
            if key in ("current_debtors_collection_rate", "repairs_maintenance_spending") and value is not None and not 0 <= value <= 100:
                note = "Source value outside 0–100%; verify against audited statements."
            if key in ("cash_coverage", "current_ratio") and value is not None and value < 0:
                note = "Negative source value; verify against audited statements."
            values.append({"year": year(row["date"], today), "value": value, "note": note})
        values.sort(key=lambda row: row["year"], reverse=True)
        if len({row["year"] for row in values}) != len(values):
            raise ValueError(f"Duplicate period in {key}")
        # Missing values stay missing, including at the newest reporting period.
        indicators[key] = {"unit": unit, "formula": series.get("formula_v2", series.get("formula", {})).get("text"), "values": values[:5]}
    return {"code": code, "name": geo["short_name"], "province": geo["province_name"],
            "audits": audits[:5], "indicators": indicators}


def parse_profile(html, code, today):
    parser = PageData()
    parser.feed(html)
    if len(parser.blocks) != 1:
        raise ValueError("Missing or duplicate Treasury page-data block")
    notice = re.search(r"Figures\s+have been updated with the latest\s+([^\n]+?)\s+data", " ".join(parser.parts))
    if not notice:
        raise ValueError("Missing publisher update notice")
    result = normalize_profile(json.loads(parser.blocks[0]), code, today)
    result["publisherUpdate"] = notice.group(1).strip()
    result["sourceSha256"] = hashlib.sha256(html.encode("utf-8")).hexdigest()
    result["source"] = f"{ORIGIN}/profiles/municipality-{code}-{METROS[code]}/"
    return result


class SameOriginRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, response, code, message, headers, url):
        if urllib.parse.urlparse(url).netloc != urllib.parse.urlparse(ORIGIN).netloc:
            raise ValueError("Refusing cross-origin source redirect")
        return super().redirect_request(request, response, code, message, headers, url)


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
    opener = urllib.request.build_opener(SameOriginRedirect())
    for attempt in range(3):
        try:
            with opener.open(request, timeout=30) as response:
                body = response.read(3_000_001)
                if len(body) > 3_000_000:
                    raise ValueError("Source response exceeds size limit")
                return body.decode("utf-8")
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise
            time.sleep(2 ** attempt)
    raise RuntimeError("Source unavailable")


def validate_regression(snapshot, previous):
    if previous.get("schemaVersion") != snapshot["schemaVersion"]:
        raise ValueError("Unsupported previous snapshot schema")
    for code, old in previous["municipalities"].items():
        new = snapshot["municipalities"][code]
        if new["audits"][0]["year"] < old["audits"][0]["year"]:
            raise ValueError(f"Audit history regressed for {code}")
        for key, series in old["indicators"].items():
            values = new["indicators"][key]["values"]
            if series["values"] and (not values or values[0]["year"] < series["values"][0]["year"]):
                raise ValueError(f"Indicator history regressed for {code}/{key}")


def atomic_write(target, snapshot):
    target.parent.mkdir(parents=True, exist_ok=True)
    content = json.dumps(snapshot, indent=2, ensure_ascii=False, allow_nan=False) + "\n"
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=target.parent, delete=False) as output:
            temporary = output.name
            output.write(content)
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, target)
    finally:
        if temporary and os.path.exists(temporary):
            os.unlink(temporary)


def wait_between_requests(seconds):
    deadline = time.monotonic() + seconds
    while (remaining := deadline - time.monotonic()) > 0:
        time.sleep(min(remaining, 30))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--input-dir", type=Path, help="Parse previously captured public HTML offline")
    parser.add_argument("--output", type=Path, default=ROOT / "src/lib/municipal-snapshot.json")
    args = parser.parse_args()
    today = dt.datetime.now(dt.timezone.utc).date()
    robots = None
    if not args.input_dir:
        robots = urllib.robotparser.RobotFileParser()
        try:
            robots.parse(fetch(ORIGIN + "/robots.txt").splitlines())
        except urllib.error.HTTPError as error:
            if error.code != 404:
                raise
            robots.parse([])
    records = {}
    for index, (code, slug) in enumerate(METROS.items()):
        url = f"{ORIGIN}/profiles/municipality-{code}-{slug}/"
        if robots and not robots.can_fetch(USER_AGENT, url):
            raise ValueError(f"Source robots policy disallows {code}")
        html = (args.input_dir / f"{code}.html").read_text(encoding="utf-8") if args.input_dir else fetch(url)
        records[code] = parse_profile(html, code, today)
        print(f"Validated {code}: audit year-end {records[code]['audits'][0]['year']}", flush=True)
        if not args.input_dir and index < len(METROS) - 1:
            delay = max(1, robots.crawl_delay(USER_AGENT) or 0)
            print(f"Respecting source crawl delay: {delay} seconds before next profile.", flush=True)
            wait_between_requests(delay)
    snapshot = {"schemaVersion": 1, "retrievedAt": today.isoformat(),
                "publisher": "National Treasury · Municipal Money",
                "publicationDate": None,
                "publicationNote": "Publisher supplies a quarter update notice, not an exact publication date.",
                "verification": "Treasury states the latest data is being verified for completeness and integrity. Indicators are municipality-wide, not property bills or a service-delivery forecast.",
                "terms": ORIGIN + "/terms", "municipalities": records}
    if args.output.exists():
        validate_regression(snapshot, json.loads(args.output.read_text()))
    if not args.check:
        atomic_write(args.output, snapshot)
    print("All eight metros validated." + (" No files modified." if args.check else " Snapshot replaced atomically."))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, TypeError, OSError) as error:
        print(f"Refresh failed: {error}. Published snapshot was not replaced.", file=sys.stderr)
        sys.exit(1)
