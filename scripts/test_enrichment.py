"""Offline contract and failure tests for the public-source importer."""
import copy
import datetime as dt
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import urllib.error
import urllib.request

spec = importlib.util.spec_from_file_location("enrichment", Path(__file__).with_name("refresh-enrichment.py"))
enrichment = importlib.util.module_from_spec(spec)
spec.loader.exec_module(enrichment)
FIXTURE = json.loads(Path(__file__).with_name("fixtures").joinpath("treasury-profile.json").read_text())
TODAY = dt.date(2026, 10, 13)


class ImportTests(unittest.TestCase):
    def setUp(self):
        self.data = copy.deepcopy(FIXTURE)

    def parse(self):
        return enrichment.normalize_profile(self.data, "CPT", TODAY)

    def test_real_source_units_and_reporting_convention(self):
        result = self.parse()
        self.assertEqual(result["audits"][0]["year"], 2024)
        self.assertEqual(result["indicators"]["cash_coverage"]["values"][0]["value"], 2.6)
        self.assertEqual(result["indicators"]["capital_budget_spending"]["values"][0]["value"], -17.27)
        self.assertNotIn("mayoral_staff", result)

    def test_page_data_contract_and_publisher_notice(self):
        html = '<p>Figures have been updated with the latest 2026 Q2 data</p><script type="application/json" id="page-data">' + json.dumps(self.data) + '</script>'
        result = enrichment.parse_profile(html, "CPT", TODAY)
        self.assertEqual(result["publisherUpdate"], "2026 Q2")
        self.assertEqual(len(result["sourceSha256"]), 64)
        for invalid in ("<p>Loading...</p>", html + html, html.replace("Figures", "Changed")):
            with self.assertRaises(ValueError):
                enrichment.parse_profile(invalid, "CPT", TODAY)

    def test_wrong_metro_rejected(self):
        self.data["geography"]["geo_code"] = "JHB"
        with self.assertRaises(ValueError):
            self.parse()

    def test_unit_drift_rejected(self):
        self.data["indicators"]["cash_coverage"]["result_type"] = "%"
        with self.assertRaises(ValueError):
            self.parse()

    def test_unknown_audit_and_unsafe_report_rejected(self):
        for code, url in (("new-taxonomy", "https://example.com/"), ("unqualified", "javascript:alert(1)")):
            self.data["audit_opinions"]["values"][0].update(rating=code, report_url=url)
            with self.assertRaises(ValueError):
                self.parse()

    def test_missing_is_not_zero_and_outlier_is_flagged(self):
        row = self.data["indicators"]["repairs_maintenance_spending"]["values"][0]
        for value in (None, 0, 109.51):
            row["result"] = value
            normalized = self.parse()["indicators"]["repairs_maintenance_spending"]["values"][0]
            self.assertEqual(normalized["value"], value)
            self.assertEqual(normalized["note"] is not None, value == 109.51)

    def test_nonfinite_and_strings_rejected(self):
        for value in (float("nan"), float("inf"), "N/A", True):
            self.data["indicators"]["cash_coverage"]["values"][0]["result"] = value
            with self.assertRaises(ValueError):
                self.parse()

    def test_duplicate_and_future_years_rejected(self):
        for value in (2027, 2023):
            self.data["audit_opinions"]["values"][0]["date"] = value
            with self.assertRaises(ValueError):
                self.parse()

    def test_regression_rejected(self):
        old = {"schemaVersion": 1, "municipalities": {"CPT": self.parse()}}
        new = copy.deepcopy(old)
        new["municipalities"]["CPT"]["indicators"]["cash_coverage"]["values"].pop(0)
        with self.assertRaises(ValueError):
            enrichment.validate_regression(new, old)

    def test_failed_atomic_write_preserves_published_file(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "snapshot.json"
            target.write_text('{"old":true}')
            with patch.object(enrichment.os, "replace", side_effect=OSError("disk failure")):
                with self.assertRaises(OSError):
                    enrichment.atomic_write(target, {"new": True})
            self.assertEqual(target.read_text(), '{"old":true}')
            self.assertEqual(list(Path(directory).iterdir()), [target])

    def test_http_403_is_not_retried(self):
        error = urllib.error.HTTPError(enrichment.ORIGIN, 403, "Forbidden", {}, None)
        with patch.object(enrichment.urllib.request, "build_opener") as opener, patch.object(enrichment.time, "sleep") as sleep:
            opener.return_value.open.side_effect = error
            with self.assertRaises(urllib.error.HTTPError):
                enrichment.fetch(enrichment.ORIGIN)
            self.assertEqual(opener.return_value.open.call_count, 1)
            sleep.assert_not_called()

    def test_cross_origin_redirect_rejected(self):
        with self.assertRaises(ValueError):
            enrichment.SameOriginRedirect().redirect_request(urllib.request.Request(enrichment.ORIGIN), None, 302, "", {}, "https://other.example.com/")

    def test_complete_live_refresh_obeys_crawl_delay_and_check_does_not_write(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "snapshot.json"
            responses = ["User-agent: *\nAllow: /\nCrawl-Delay: 120"]
            for code in enrichment.METROS:
                profile = copy.deepcopy(FIXTURE)
                profile["geography"]["geo_code"] = code
                responses.append('<p>Figures have been updated with the latest 2026 Q2 data</p><script id="page-data">' + json.dumps(profile) + '</script>')
            with patch.object(enrichment.sys, "argv", ["refresh", "--check", "--output", str(target)]), patch.object(enrichment, "fetch", side_effect=responses) as fetch, patch.object(enrichment, "wait_between_requests") as wait:
                enrichment.main()
            self.assertEqual(fetch.call_count, 9)
            self.assertEqual(wait.call_count, 7)
            self.assertTrue(all(call.args == (120,) for call in wait.call_args_list))
            self.assertFalse(target.exists())

    def test_late_source_failure_keeps_previous_snapshot(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "snapshot.json"
            target.write_text('{"old":true}')
            first = '<p>Figures have been updated with the latest 2026 Q2 data</p><script id="page-data">' + json.dumps(FIXTURE) + '</script>'
            with patch.object(enrichment.sys, "argv", ["refresh", "--output", str(target)]), patch.object(enrichment, "fetch", side_effect=["User-agent: *\nAllow: /", first, "<p>Unavailable</p>"]), patch.object(enrichment, "wait_between_requests"):
                with self.assertRaises(ValueError):
                    enrichment.main()
            self.assertEqual(target.read_text(), '{"old":true}')


if __name__ == "__main__":
    unittest.main()
