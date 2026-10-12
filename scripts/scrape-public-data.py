"""Refresh the attributed numeric Woodstock snapshot. Uses public pages only.

Run: python scripts/scrape-public-data.py
Review changes before committing. This is a secondary aggregation of SAPS
records, not an address-level risk score or a licensed property dataset.
"""
import datetime
import json
import pathlib
import re
import urllib.request
from html.parser import HTMLParser

SOURCE = 'https://capetowndata.com/en/reports/crime/woodstock/'

class TextParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.skip = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self.skip += 1

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.skip = max(0, self.skip - 1)

    def handle_data(self, data):
        if not self.skip and data.strip():
            self.parts.append(data.strip())

request = urllib.request.Request(SOURCE, headers={'User-Agent': 'HomeBuyerResearch/1.0 (public numeric snapshot; manual review)'})
with urllib.request.urlopen(request, timeout=30) as response:
    parser = TextParser()
    parser.feed(response.read().decode('utf-8'))
text = ' '.join(parser.parts)
match = re.search(r'Break-ins down by a third (.*?) All seven types steady', text)
if not match:
    raise SystemExit('Source layout changed. No files modified; review the page manually.')
pairs = re.findall(r'(\d{2}/\d{2}):\s*([\d,]+)', match.group(1))
if len(pairs) != 5:
    raise SystemExit('Unexpected reporting periods. No files modified.')
release = re.search(r'Police figures released (\d{1,2} \w+ \d{4})', text)
if not release:
    raise SystemExit('Missing release date. No files modified.')
result = {
    'station': 'Woodstock SAPS', 'category': 'Residential break-ins',
    'periodConvention': 'July–June reporting years',
    'periods': [year for year, _ in pairs],
    'counts': [int(n.replace(',', '')) for _, n in pairs],
    'source': SOURCE, 'underlyingSource': 'SAPS quarterly station statistics',
    'releaseDate': datetime.datetime.strptime(release.group(1), '%d %B %Y').date().isoformat(),
    'retrievedAt': datetime.date.today().isoformat(),
    'scope': 'Woodstock precinct; not a street or individual property',
    'verification': 'Secondary aggregation; primary SAPS download unavailable during retrieval',
}
target = pathlib.Path(__file__).resolve().parents[1] / 'src/lib/crime-snapshot.json'
target.write_text(json.dumps(result, indent=2) + '\n')
print(f'Updated {target.name}: {len(pairs)} attributed reporting periods. Review before use.')
