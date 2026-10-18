# October 2026 research: implementation and launch work

The product remains HomeBuyer Reality Check while HomeScope is a proposed name.
The research’s scores, launch prices and revenue scenarios are hypotheses, not
published ratings or validated demand. This change implements the remaining
buyer-decision features that fit the current free static MVP.

| Research action                               | Implementation                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| True monthly ownership cost                   | Existing amortisation and bills, now with +1/+2 percentage-point scenarios, income share and fixed-rate lifetime interest.                                                                                                                                                     |
| Cash required before registration             | Dated SARS duty plus deposit and five editable quote categories. Unknown amounts stay blank and the subtotal remains incomplete.                                                                                                                                               |
| Compare up to three homes                     | Select any two or three from the saved shortlist. Compare baseline and stressed costs, cash completeness, source periods and remaining checks.                                                                                                                                 |
| Guided due diligence                          | Eight checks, including condition disclosure, independent inspection, bills, compliance, title/plans, sectional-title documents and written finance/cost quotes. Original four indices remain stable for existing saves.                                                       |
| Shareable buyer report                        | Individual and comparison PDFs include inputs, scenarios, outstanding checks, sources and geographic limits. Sharing is through the downloaded file.                                                                                                                           |
| Versioned report snapshots                    | New saves copy source payloads, retrieval dates, tax brackets, indicator definitions, calculated values and checklist. Saved exports use the captured results. Older saves are retained with an explicit current-source fallback. Updating a saved home replaces the snapshot. |
| Nearby schools, shops and hospitals           | Overpass requests named schools in addition to the existing categories; live results record retrieval dates. Missing categories are visible and school admissions/catchment require confirmation.                                                                              |
| Tests for financial boundaries and buyer flow | Existing duty-bracket tests plus zero/full-deposit, tiny-rate, loan totals, cash completeness, malformed storage, snapshot/PDF and offline browser checks.                                                                                                                     |

The repo already has map/address selection, all eight metro financial snapshots,
municipal audit history, dated policing-area context, PDF export and public cost
and methodology pages. The Treasury snapshot is not a live service-quality feed;
police counts are not address-level safety probabilities. No proprietary records
or new licensing claims were added.

## Next launch milestones

1. **Validate demand in Gauteng.** Interview ten active buyers and three independent
   professionals using a real Pretoria or Johannesburg decision. Record which
   section changes a decision and whether at least three prospects would pay or
   use it. Test R149/report and R299/comparison; professional R799/month remains
   a later hypothesis. This requires customer conversations, not code changes.
2. **Contract location services.** Choose a licensed geocoder and tile provider,
   and add a server-side caching/rate-limit layer before commercial traffic.
   Public Photon/OSM/Overpass availability is not a production SLA. Do not add
   Nominatim autocomplete. Verify municipality and precinct boundaries independently;
   city labels and nearest station pins remain indications only.
3. **Move paid reporting to a server-backed app.** Static export cannot securely
   verify Paystack transactions or handle webhooks. Provision the merchant account,
   database and object storage, then implement server-verified amount/currency,
   idempotent webhook processing and report entitlements. Never unlock reports from
   a browser redirect alone. Checkout remains disconnected in this free MVP.
4. **Accounts and retention.** Add authenticated access, report ownership checks,
   deletion/export flows, privacy terms and an explicit snapshot retention policy.
   Port the snapshot contract to PostgreSQL/report snapshots; use PostGIS when
   authoritative boundary/spatial queries are introduced. Current saves are local
   to the browser and accessible to anyone using that browser profile.
5. **SAPS and licensed data.** Normalise official station releases with period,
   category, boundary and source version tests. Obtain commercial redistribution
   terms before adding ownership, sales or valuations. Keep live outages and
   automatic valuations outside the initial product scope.

Do not treat any of these milestones as completed by this PR. No payments are
charged, professionals contacted, licenses purchased or production changes deployed.

## Verification

Run `npm run test`, `npm run typecheck`, `npm run lint`, `npm run format:check`
and `npm run build`. Serve `out/` with `npm start`, then run
`npm run smoke:decision` and `npm run smoke:enrichment`.
The new browser story uses a fixed research date and blocks external services,
so it verifies local financial/reporting behaviour during provider outages. A
later clock verifies that saved duty remains captured while a current report
correctly withholds a stale-table estimate. Live provider normalization is tested
with representative OSM response fixtures; it does not establish live service
availability or data coverage.
