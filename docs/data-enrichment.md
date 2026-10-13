# Public data enrichment · researched 13 October 2026

The app remains a static export. Financial context is researched and ingested into
versioned snapshots; visitors do not call financial data providers. This makes
the report available during provider outages and keeps refreshes reviewable.

## Sources and decisions

| Source                                                                       | What is included                                                        | Scope and limitations                                                                   |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [National Treasury Municipal Money](https://municipalmoney.gov.za/)          | Eight metro profiles, audit history, seven indicators and prior periods | Municipality-wide financial evidence. The publisher flags data verification as ongoing. |
| [Treasury API documentation](https://municipaldata.treasury.gov.za/docs)     | Financial-year convention, units and underlying datasets                | A year-end of 2024 means July 2023–June 2024; missing data is not zero.                 |
| [Treasury reuse terms](https://municipalmoney.gov.za/terms)                  | Attribution and reuse conditions                                        | Commercial reuse is allowed with source/date attribution; no endorsement is claimed.    |
| [SARS transfer-duty rates](https://www.sars.gov.za/tax-rates/transfer-duty/) | Six progressive brackets effective 1 April 2026                         | Official page says no changes from April 2025. Source updated 25 February 2026.         |
| [SARS duty overview](https://www.sars.gov.za/types-of-tax/transfer-duty/)    | Acquisition timing and exemption context                                | VAT transactions and other exemptions need a conveyancer's confirmation.                |

Municipal Money's public HTML embeds an application/json script with id
`page-data`. The importer parses that structured data rather than reading
"Loading..." placeholders or deriving values from chart pixels. It extracts only
geographic labels, audits, indicators, formulas and provenance, excluding contact
and personnel records. Raw municipal profile pages were retrieved successfully
for all eight metros. SARS was verified through web research; a direct automated
download returned 403 and was not bypassed.

The Treasury update notice is **2026 Q2**. This is a site update notice, not the
date of each observation. The latest audits and most indicators in this snapshot
remain **2023/24**. An exact publisher timestamp is unavailable and remains null.
Every indicator retains its own year rather than borrowing the audit year.

Treasury's submitted audit taxonomy includes “Unqualified - Emphasis of Matter
items”; AGSA's separate report uses “unqualified with findings” in some cases.
The application now displays Treasury's own label and links the original audit
reports instead of treating those phrases as interchangeable.

One flagged source observation is eThekwini's 109.51% repairs and maintenance
figure. The app preserves the value and requests verification against audited
statements. It does not silently cap it, assign a favourable rating or infer a
household bill. Negative operating/capital variance indicates underspending, not
a negative amount of spending.

## Refresh contract

`npm run data:refresh` fetches all eight fixed HTTPS profile URLs. Requests use a
descriptive user agent, a 30-second timeout, a 3 MB limit, the publisher’s 120-second crawl delay
between profiles, and at most two retries for HTTP 429/500/502/503/504. Robots
restrictions are checked first. Cross-origin redirects and HTTP 403 fail.

Before publication the importer validates:

- A single structured block, expected metro identity and publisher update notice.
- Recognised audit taxonomy and valid report links.
- Expected indicator units, numeric finite observations or explicit nulls.
- Unique completed financial periods, descending order and no history regression.
- A complete eight-metro candidate before any replacement of the live snapshot.

The candidate is written in the target directory, flushed, and atomically renamed
over the snapshot. A fetch, parse, validation or write failure preserves the
previous file. `--check` performs the live checks without writing. `--output PATH`
produces a separate candidate. Source SHA-256 hashes allow comparisons with the
retrieved pages. Publication always includes retrieval date, publisher notice,
scope and the publisher's verification caveat.

A full live refresh takes approximately 15 minutes because the source requests
a two-minute gap between profiles. Progress is emitted during the run.

The weekly `Refresh municipal evidence candidate` workflow uploads a candidate
artifact after tests and a build. It never pushes or auto-merges updates. Download
the artifact, review changed periods, anomalies, source links and publisher notes,
then incorporate it in a normal reviewed commit. A failed refresh leaves the
committed dataset available. New municipalities, metric units or audit taxonomies
require an importer change rather than silently guessed mapping.

SARS refreshes require checking the official rates page and updating
`src/lib/transfer-duty-snapshot.json`, including its effective date, source update
and retrieval date. Verify continuity at all bracket boundaries and run the tax
tests. The table is not advertised as a live feed. Dates earlier than the stored
table, dates after today and snapshots checked more than 90 days ago return no
estimate. Prices are assumed taxable values; VAT/exemption settings suppress duty
and ask for confirmation. No legal fees are fabricated.

## Validation and remaining coverage

Offline importer tests use a reduced, attributed Treasury fixture containing no
contact data. TypeScript tests verify eight-metro coverage, matching collisions,
provenance, outlier handling, source freshness and SARS calculations. Browser
verification checks indicator rendering, history links, duty editing and
exemptions, save/restore, PDFs and mobile overflow.

Geocoder city labels are an indication, not a geospatial boundary. Suburb
substring matching has been removed. All municipalities outside the eight metros
remain unmatched unless separately implemented. Crime coverage remains the
existing attributed Woodstock secondary series; other precincts are not inferred
from the nearest police station. Public geocoding/amenity/map services remain
third-party dependencies. This change does not supply licensed listings, deeds,
valuations, property-specific tariffs, surveys or address-level crime scores.
