# HomeBuyer’s Reality Check

A South African buyer’s due-diligence companion built with Next.js, TypeScript,
Tailwind CSS, Motion, Three.js/WebGL, Phosphor icons and Leaflet. The landing page
leads into a responsive report workspace at `/check/`.

## Run

Requires Node.js 20.9 or newer.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. For a production build:

```sh
npm run build
npm start
```

The app uses Next.js static export. Production assets are in `out/`; deploy that
directory to a static host, or connect this repository to Vercel or Netlify with
`npm run build` as the build command and `out` as the publish directory. Set
`NEXT_PUBLIC_SITE_URL` to the deployment origin before building for canonical
social metadata. No API keys are required.

## Features

- Image-led landing page, original dimensional house/check app icon and wordmark.
- South African address search using Photon and OpenStreetMap, with four clearly
  labelled example properties when the public service is unavailable.
- Interactive real maps, named nearby places and calculated straight-line distances.
- Physical-material Three.js architectural model with drag rotation, evening
  lighting and roof cutaway. It is representative architecture, not a survey.
- Editable bond amortisation, deposit, interest rate, term, rates, levies,
  utilities, insurance, maintenance, income and return-commute assumptions.
- Saved report snapshots and side-by-side comparisons in browser local storage.
- Selectable two- or three-home comparisons with baseline/stressed budgets,
  upfront cash, evidence periods and a downloadable comparison PDF.
- Interest-rate sensitivity (+1/+2 percentage points), fixed-rate lifetime
  interest and purchase-cost quotes with explicit unknown amounts.
- Viewing checklist and downloadable multi-page PDFs with source links and scope.
- Native modal focus trapping, mobile bottom navigation, reduced-motion support,
  map/WebGL/search fallback states and browser back navigation for report tabs.
- Light, Dark and System themes, remembered across visits and synced between tabs.
- Public methodology and ownership-cost guide, metadata, structured data, social
  preview image, robots, sitemap and AI-readable Markdown documentation.

## Brand, SEO and AI discovery

The current working name is **HomeBuyer Reality Check**. The researched creative
shortlist and recommendation are in [docs/brand-direction.md](docs/brand-direction.md).
Change `src/lib/brand.ts` to update visible branding, metadata, the manifest, PDF
headers and AI documentation together. The storage keys remain stable.

Set `NEXT_PUBLIC_SITE_URL` to the real public origin before the production build.
It must be an HTTP(S) origin without a path, query, fragment or credentials.
Without it, public preview pages are marked `noindex`, canonical URLs are omitted,
and the sitemap is empty. With it, public pages receive absolute canonical and
social URLs and the sitemap includes `/`, `/methodology/` and
`/guides/home-ownership-costs/`. `/check/` always stays `noindex`; no personal
addresses, budget inputs or saved reports enter the public discovery files.

The site exposes `/llms.txt`, `/llms-full.txt`, an equivalent `/LLM.txt` alias and
Markdown versions at `/index.md`, `/methodology/index.md` and
`/guides/home-ownership-costs/index.md`. The content follows the
[llms.txt proposal](https://llmstxt.org/) and is generated from the same brand and
editorial sources as the public pages. These files provide context; they are not
a promise that a search or AI provider will index or cite the site.

Structured data describes the actual free MVP and intended future report range.
It contains no invented reviews, ratings or business contact information. The
1200×630 social preview is generated locally at `/social-preview/og.png`.

Theme controls appear in the landing, report and documentation headers. System
mode follows `prefers-color-scheme`, including changes while the app is open.
A small pre-paint script applies a stored preference before rendering. The
preference is saved under `homebuyer:theme`; browser storage failures still allow
theme switching for the current visit.

## Validation

```sh
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
```

The calculator tests verify a known bond repayment, zero-interest and full-deposit
cases, return-commute costs and coordinate-based distance. The browser smoke test
is in `scripts/browser-smoke.mjs` and uses an installed Chromium executable; run
it against a production preview with `npm run smoke`.
`npm run smoke:discovery` verifies theme persistence, device and tab sync,
responsive theme controls, dark dialogs, public crawl files, social images,
server-rendered documentation and the workspace’s indexing policy.
`npm run smoke:enrichment` verifies all eight metros, audit links, financial
periods, duty and exemptions, saved settings, PDF export and mobile layouts with
external services blocked. CI runs this against the production export.
`npm run smoke:decision` verifies the Pretoria buyer flow, upfront quotes,
eight checks, selecting three homes from a larger shortlist, comparison PDFs,
historical snapshot export and mobile/dark layouts. New saved reports copy the
source payloads and calculations; PDFs keep those captured results. Updating a
save replaces the snapshot. Older saves use current evidence with a visible note.
See [research actions and launch prerequisites](docs/research-actions.md).

## Data and honest boundaries

Example addresses, property prices and monthly bills are illustrative inputs,
not listings or valuations. Example coordinates are approximate. All photography
is representative; none is claimed to depict the selected address. The default
10.75% interest rate is an editable assumption, not a live bank quote. Income
share is a calculation, not an affordability recommendation. Monthly budgets
exclude transfer duty, conveyancing and bond-registration fees.

Municipal evidence now covers **all eight metros**: Cape Town, Johannesburg,
eThekwini, Tshwane, Buffalo City, Ekurhuleni, Mangaung and Nelson Mandela Bay.
The report includes audit history with links to original reports and seven
financial indicators with prior-year observations: cash balance, cash coverage,
current ratio, revenue collection, operating and capital budget variance, and
repairs and maintenance. [National Treasury Municipal Money](https://municipalmoney.gov.za/)
publishes the source data. Its [terms](https://municipalmoney.gov.za/terms)
permit reuse with attribution; Treasury does not endorse this application.

Each observation keeps its own financial year (Treasury's year-end 2024 means
2023/24), unit and missing values. The latest audit in the retrieved snapshot is
2023/24, even though the publisher's site update notice says 2026 Q2. No exact
publication timestamp is supplied, so it is stored as null. Treasury states the
latest data is being verified for completeness and integrity. Unusual values,
including eThekwini's 109.51% repairs/maintenance figure, are retained with a
verification flag; they are not converted into household costs or safety scores.
City matches use exact known labels and aliases, not suburb substrings. They do
not establish a municipal boundary; verify against the seller's account.

The budget tab also provides a separate deposit-and-transfer-duty subtotal using
[the official SARS table](https://www.sars.gov.za/tax-rates/transfer-duty/), effective
1 April 2026, updated 25 February 2026 and checked 13 October 2026. Purchase price
is assumed to be the taxable value; the deposit does not reduce duty. The
acquisition agreement date and exemption setting persist in saved reports and
appear in PDFs. Unsupported dates, possible VAT/exemptions and a table checked
more than 90 days ago produce no estimate. Conveyancing, bond registration,
moving, VAT and other costs require separate quotes. The upfront planner accepts
those quotes separately; blank means unresolved, while a confirmed zero is
included. Its known subtotal is marked incomplete until duty and all five quote
categories are resolved. SARS was available via web
research, while a direct automated request returned HTTP 403; no bypass was used.
The table is deliberately maintained through source review, not guessed updates.

Woodstock residential break-ins, plus the seven recorded categories for July
2025–June 2026, use [Cape Town Data’s aggregation of SAPS records](https://capetowndata.com/en/reports/crime/woodstock/),
retrieved 13 October 2026, with the release date and July–June reporting periods
stored in `src/lib/crime-snapshot.json`. Primary SAPS downloads were unavailable
during retrieval. These are precinct counts, never street-level risk scores.
The Observatory example uses Woodstock SAPS, which also covers Salt River,
Observatory and Walmer Estate. Parkhurst is labelled Parkview SAPS and Menlo Park
is labelled Brooklyn SAPS from OpenStreetMap station pins, without a crime series.
Umhlanga has no station assigned.

Refresh official municipal evidence:

```sh
npm run data:check    # live fetch and validation; no file changes
npm run data:refresh  # validate all eight metros, then atomically replace snapshot
```

The standard-library Python importer respects robots policies, identifies itself,
honors the source’s 120-second crawl delay, bounds response size and timeout, retries only 429/transient
server failures, and refuses cross-origin redirects. Schema/unit drift, wrong
metro identity, unknown audit codes, duplicate/future periods and regressing
history fail without replacing the last snapshot. Source hashes, publisher update
notices and retrieval dates are stored with the data. No personal contact data is
extracted. Captured public HTML can be parsed offline with `--input-dir`; use files
named `CPT.html`, `JHB.html`, etc. `--output` can create a review candidate.

A weekly GitHub Actions job creates a candidate artifact and runs validation.
Publishing updated data requires incorporating that artifact in a reviewed commit;
the job does not automatically push data. Builds use the committed snapshot and
need no network access to Treasury or SARS. The report and PDF flag municipal
snapshots retrieved more than 90 days ago. Dates of retrieval do not upgrade the
underlying financial reporting periods.

Refresh the separate secondary Woodstock crime snapshot with:

```sh
python3 scripts/scrape-public-data.py
```

Review the source and diff before publishing. This scraper does not scrape listing
websites or bypass access controls. Unmatched municipal/precinct fields remain
unavailable. See [the research and maintenance notes](docs/data-enrichment.md).

Public geocoding, OSM maps and nearby-place services depend on third-party
availability and usage policies. A production service should add its own
rate-limited data layer or a contracted provider. This MVP contains no licensed
valuation, historic deed transactions, legal-title verification, building survey
or exact address-level crime prediction.

## Pricing and privacy

R99–R299 is the intended per-report range. This MVP is free early access: checkout
is not connected, and no action charges a visitor. There is no account service,
cloud sync or cloud report storage. Saved homes stay in this browser; exporting
a PDF provides a portable copy.

## Image credits

Images are downloaded from Unsplash and bundled locally for reliable rendering.

- [House exterior](https://images.unsplash.com/photo-1600047509782-20d39509f26d), Unsplash asset `photo-1600047509782-20d39509f26d`.
- Living room photographs: [main interior](https://images.unsplash.com/photo-1600210492486-724fe5c67fb0) and [second interior](https://images.unsplash.com/photo-1600607687920-4e2a09cf159d).
- Manrope is distributed under the SIL Open Font License; see `public/fonts/OFL.txt`.

The user-supplied smart-home references informed the rounded controls, warm
neutrals, lime highlights and budget gauge. The architectural scroll treatment of
the supplied ISA Studio landing-page reference informed the 3D presentation.
