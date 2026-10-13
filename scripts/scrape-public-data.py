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
all_match = re.search(r'All seven types steady since \d{2}/\d{2} (.*?) Across Cape Town', text)
if not all_match:
    raise SystemExit('Missing seven-type series. No files modified.')
all_pairs = re.findall(r'(\d{2}/\d{2}):\s*([\d,]+)', all_match.group(1))
if [year for year, _ in all_pairs] != [year for year, _ in pairs]:
    raise SystemExit('Seven-type periods do not match break-ins. No files modified.')
latest = re.search(
    r'(\d[\d,]*) thefts, (\d[\d,]*) car crimes, (\d[\d,]*) robberies, (\d[\d,]*) assaults, (\d[\d,]*) break-ins, (\d[\d,]*) sexual offences and (\d[\d,]*) murders',
    text,
)
prior = re.search(
    r'year earlier Murder (\d[\d,]*) (\d[\d,]*) Sexual offences (\d[\d,]*) (\d[\d,]*) Robbery (\d[\d,]*) (\d[\d,]*) Assault (\d[\d,]*) (\d[\d,]*) Break-ins (\d[\d,]*) (\d[\d,]*) Car crime (\d[\d,]*) (\d[\d,]*) Theft (\d[\d,]*) (\d[\d,]*)',
    text,
)
if not latest or not prior:
    raise SystemExit('Missing latest category table. No files modified.')
def as_count(value):
    return int(value.replace(',', ''))
categories = [
    {'name': 'Theft', 'count': as_count(latest.group(1)), 'prior': as_count(prior.group(14))},
    {'name': 'Car crime', 'count': as_count(latest.group(2)), 'prior': as_count(prior.group(12))},
    {'name': 'Robbery', 'count': as_count(latest.group(3)), 'prior': as_count(prior.group(6))},
    {'name': 'Assault', 'count': as_count(latest.group(4)), 'prior': as_count(prior.group(8))},
    {'name': 'Residential break-ins', 'count': as_count(latest.group(5)), 'prior': as_count(prior.group(10))},
    {'name': 'Sexual offences', 'count': as_count(latest.group(6)), 'prior': as_count(prior.group(4))},
    {'name': 'Murder', 'count': as_count(latest.group(7)), 'prior': as_count(prior.group(2))},
]
if categories[4]['count'] != int(pairs[-1][1].replace(',', '')):
    raise SystemExit('Latest break-ins do not match the five-year series. No files modified.')
if categories[4]['prior'] != int(pairs[-2][1].replace(',', '')):
    raise SystemExit('Prior-year break-ins do not match the five-year series. No files modified.')
coverage = re.search(r'The station covers ([^.]+)\.', text)
if not coverage:
    raise SystemExit('Missing station coverage sentence. No files modified.')
release = re.search(r'Police figures released (\d{1,2} \w+ \d{4})', text)
if not release:
    raise SystemExit('Missing release date. No files modified.')
result = {
    'station': 'Woodstock SAPS', 'category': 'Residential break-ins',
    'periodConvention': 'July–June reporting years',
    'periods': [year for year, _ in pairs],
    'counts': [int(n.replace(',', '')) for _, n in pairs],
    'allTypes': [int(n.replace(',', '')) for _, n in all_pairs],
    'latestLabel': 'July 2025–June 2026',
    'categories': categories,
    'source': SOURCE, 'underlyingSource': 'SAPS quarterly station statistics',
    'releaseDate': datetime.datetime.strptime(release.group(1), '%d %B %Y').date().isoformat(),
    'retrievedAt': datetime.date.today().isoformat(),
    'coverage': coverage.group(1),
    'scope': 'Woodstock precinct, including Observatory; not a street or individual property',
    'verification': 'Secondary aggregation; primary SAPS download unavailable during retrieval',
}
target = pathlib.Path(__file__).resolve().parents[1] / 'src/lib/crime-snapshot.json'
target.write_text(json.dumps(result, indent=2) + '\n')
print(f'Updated {target.name}: {len(pairs)} attributed reporting periods. Review before use.')
