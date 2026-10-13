import { brand } from './brand';
import { sources } from './data';
import crime from './crime-snapshot.json';
import { municipalSnapshot } from './municipal-evidence';
import { transferDutyEvidence } from './purchase-costs';

export type EditorialSection = { title: string; paragraphs: string[]; points?: string[] };
export const methodologySections: EditorialSection[] = [
  {
    title: 'A report for the buyer’s everyday life',
    paragraphs: [
      `${brand.name} helps South African homebuyers investigate the ongoing costs and local context of a property. The report combines your assumptions with clearly attributed public information. It is independent of property advertising.`,
      'An example report is an illustration of the workflow. Its address, price, bills, approximate map pin, photography and architectural model are not a verified listing or survey.',
    ],
  },
  {
    title: 'What the ownership budget calculates',
    paragraphs: [
      'Monthly bond repayments use a standard amortisation formula: principal × monthly interest rate ÷ (1 − (1 + monthly interest rate) raised to the negative number of months). At zero interest, principal is divided by the number of months.',
      'We add your rates, levies, utilities, home insurance, maintenance reserve and commute allowance. The default annual interest rate of 10.75% is an editable assumption, not a live prime-rate feed or lender quote.',
    ],
    points: [
      'Principal is your purchase price less your deposit.',
      'The commute allowance is one-way kilometres × 2 × workdays × your cost per kilometre.',
      'The initial maintenance reserve uses an illustrative 1% of the purchase price per year. After that, it is your editable monthly amount.',
      'Income share divides the monthly estimate by the take-home income you enter. It is not a lending or affordability recommendation.',
      'Transfer duty, conveyancing, bond registration and other once-off purchase costs are outside the monthly estimate.',
    ],
  },
  {
    title: 'Addresses, maps and nearby places',
    paragraphs: [
      'Live address search uses Photon’s OpenStreetMap index. Maps use OpenStreetMap tiles. New addresses request named nearby essentials through the public Overpass service. Coverage and third-party availability vary.',
      'Example reports contain an attributed snapshot of named places. Nearby distances are calculated from coordinates and are approximate straight-line distances, not walking routes or traffic estimates. Always check the property pin and actual route.',
    ],
  },
  {
    title: 'Municipal evidence has a date',
    paragraphs: [
      `National Treasury Municipal Money provides audit history and seven financial indicators for all eight metropolitan municipalities. The latest audit in this snapshot is financial year 2023/24. Retrieved ${municipalSnapshot.retrievedAt}; the publisher supplies a quarter update notice, not an exact publication date. Each indicator retains its own reporting year, source unit and missing values.`,
      'Financial indicators cover cash balance, cash coverage, the current ratio, revenue collection, operating and capital budget variance, and repairs and maintenance. Negative budget variance means underspending. Source values outside an expected range remain visible with a verification note. Treasury says its latest data is being verified for completeness and integrity. The figures are not property bills or service forecasts.',
      'City labels are matched exactly to known metro names and aliases. This is an indication from the geocoder, not a verified municipal boundary. Confirm the municipality from the seller’s account; ambiguous suburbs and unmatched cities remain unresolved.',
      'An audit opinion is evidence about financial governance for a reporting period. It does not guarantee service delivery, infrastructure condition, tariffs or future municipal performance. A verified audit snapshot is not available for every municipality in this MVP.',
    ],
  },
  {
    title: 'A separate purchase-tax estimate',
    paragraphs: [
      `The budget tab estimates transfer duty separately from monthly ownership costs using the SARS table effective ${transferDutyEvidence.effectiveFrom}, updated ${transferDutyEvidence.sourceUpdatedAt} and retrieved ${transferDutyEvidence.retrievedAt}. The assumed taxable value is the entered purchase price, before any deposit deduction. SARS states that the April 2026 table is unchanged from April 2025.`,
      'Use the acquisition agreement date. This snapshot supports dates from 1 April 2026 through today. The estimate is withheld for unsupported dates, possible exemptions or VAT transactions, and when the source has not been checked for more than 90 days. Confirm taxable value, any exemption and the applicable rates with your conveyancer.',
      'The deposit plus duty subtotal is not a complete cash requirement. Conveyancing, bond registration, moving, VAT where applicable and other charges require separate quotes. The acquisition date and exemption setting are saved with the budget and carried into the PDF.',
    ],
  },
  {
    title: 'Police records describe a precinct',
    paragraphs: [
      `The Observatory example uses Woodstock SAPS. Cape Town Data says that station covers Woodstock, Salt River, Observatory and Walmer Estate. Its residential break-in series, and the seven recorded categories for the latest July–June year, are a secondary aggregation of SAPS records, retrieved ${crime.retrievedAt}, with release date ${crime.releaseDate}. Reporting periods run July–June.`,
      'The primary SAPS download was unavailable during retrieval. The report makes that verification limit visible and links to both the aggregation and official SAPS statistics.',
      'Parkview SAPS is the named station near the Parkhurst example, and Brooklyn SAPS in Pretoria near the Menlo Park example, using OpenStreetMap locations. No verified time series is stored for those stations. Umhlanga is left without a station until the boundary is confirmed.',
      'Precinct counts do not measure the safety of an individual street or property. We do not assign an address-level safety score. Compare the same crime category and reporting period, verify the precinct, visit at different times and speak to neighbours and the local community policing forum.',
    ],
  },
  {
    title: 'What needs another source or a professional check',
    paragraphs: [
      'This MVP does not provide a licensed valuation, historic deeds transactions, legal-title verification, a building survey or exact address-level crime prediction. Those questions need additional data or an appropriate professional.',
      'Use recent municipal accounts, levy statements, an insurance quote, a lender quote and an independent inspection when reviewing a purchase. No report can substitute for all of these checks.',
    ],
  },
  {
    title: 'Pricing and your browser’s data',
    paragraphs: [
      'The intended future report range is R99–R299. The current MVP offers free early access: payment processing is not connected and no action charges you.',
      'Saved comparisons, budgets and checklists stay in this browser’s local storage. There is no account, cloud sync or cloud report storage. Export a PDF to keep a portable copy.',
      'Address search sends your query to Photon. Nearby-place requests send coordinates to Overpass. Map requests go to OpenStreetMap. These public services apply their own privacy and usage policies.',
      'The report workspace is marked noindex. That is a discovery setting, not access control. Public robots and AI guide files contain product documentation only, never saved reports or personal financial inputs.',
    ],
  },
];

export const ownershipSections: EditorialSection[] = [
  {
    title: 'Start with the monthly picture',
    paragraphs: [
      'A purchase price tells you what the home costs to acquire. The monthly budget asks a different question: what could it cost to own and live in it?',
      'Use actual bills and your own quotes where possible. A realistic budget can include a bond repayment, municipal rates, levies, utilities, insurance, a maintenance reserve and the cost of your regular commute.',
    ],
  },
  {
    title: '1. The bond repayment',
    paragraphs: [
      'Your deposit reduces the amount financed. The repayment also depends on the interest rate and term. Enter a lender’s quoted rate rather than assuming a default is the rate you will receive.',
      'Changing the deposit, interest rate or term changes the repayment. A lower monthly repayment does not by itself describe the total lifetime cost of the loan. The calculator estimates a standard fixed-input amortising payment; it does not model future rate changes or a bank’s full lending terms.',
    ],
  },
  {
    title: '2. Rates, levies and utilities',
    paragraphs: [
      'Ask for recent municipal accounts and levy statements. Confirm which services are included and which you will pay separately. Water, electricity, refuse, sewerage and other charges may be billed differently for different properties.',
      'For a sectional-title home or a property in an estate, ask about ordinary levies and any special levies. Use the amounts for the actual property instead of a city-wide average.',
    ],
  },
  {
    title: '3. Insurance and maintenance',
    paragraphs: [
      'Get an insurance quote for the property and your situation. Do not treat an example premium as a confirmed insurance cost.',
      'A maintenance reserve is money set aside for repairs. The example starts at 1% of the price per year, divided by 12; this is an illustrative budgeting assumption, not a prediction of repair costs. Adjust it for what an independent inspection reveals. Changing the price later does not automatically replace your chosen reserve.',
    ],
  },
  {
    title: '4. The commute you will actually make',
    paragraphs: [
      'Enter a realistic one-way distance, the number of days you expect to travel and your allowance for fuel and wear. The monthly estimate includes return trips.',
      'A straight-line map distance is not a road route. Check the route yourself and consider traffic, tolls, parking or public-transport costs separately where they matter. There is no live traffic-time estimate in this MVP.',
    ],
  },
  {
    title: 'Keep once-off costs on a separate list',
    paragraphs: [
      'Monthly ownership costs are only part of the purchase decision. Keep a separate list for transfer duty where applicable, conveyancing, bond registration, moving and any immediate work on the home.',
      'The budget tab provides a dated SARS transfer-duty estimate alongside your deposit, separately from the monthly total. Confirm the acquisition date, taxable value and any VAT or exemption with your conveyancer. Legal fees and other purchase costs require written quotes.',
    ],
  },
  {
    title: 'Compare homes using the same questions',
    paragraphs: [
      'Save each report with its own assumptions. A useful comparison shows the monthly costs and the questions still open, rather than simply ranking asking prices.',
      'A municipal audit and police-precinct statistics provide context for investigation. They are not a street-level safety guarantee or a substitute for visiting the neighbourhood and checking the property.',
    ],
  },
];

export const evidenceLinks = [
  {
    label: 'National Treasury · municipal financial data API and definitions',
    href: 'https://municipaldata.treasury.gov.za/docs',
  },
  { label: 'National Treasury · data reuse terms and limitations', href: municipalSnapshot.terms },
  ...Object.values(municipalSnapshot.municipalities).map((metro) => ({
    label: `National Treasury · ${metro.name} audit and financial history`,
    href: metro.source,
  })),
  { label: 'SARS · transfer-duty rates effective April 2026', href: transferDutyEvidence.source },
  { label: 'City of Cape Town audit release · FY 2023/24', href: sources.audit },
  { label: 'AGSA · Western Cape 2023-24', href: sources.westernCape },
  { label: 'AGSA · City of Johannesburg 2023-24', href: sources.johannesburg },
  { label: 'AGSA · eThekwini Metro 2023-24', href: sources.ethekwini },
  { label: 'AGSA · Gauteng 2023-24, including Tshwane', href: sources.gauteng },
  { label: 'National Treasury Municipal Money · Cape Town', href: sources.treasury },
  { label: 'Cape Town Data · Woodstock series and category definitions', href: crime.source },
  { label: 'South African Police Service · official crime statistics', href: sources.police },
  {
    label: 'OpenStreetMap · attribution and copyright',
    href: 'https://www.openstreetmap.org/copyright',
  },
  { label: 'Photon · address-search project', href: 'https://photon.komoot.io/' },
  { label: 'Overpass · nearby-place service', href: 'https://overpass-api.de/' },
  {
    label: 'SARS · transfer-duty information',
    href: 'https://www.sars.gov.za/types-of-tax/transfer-duty/',
  },
];

export function sectionsMarkdown(title: string, summary: string, sections: EditorialSection[]) {
  return `# ${title}\n\n> ${summary}\n\n${sections.map((section) => `## ${section.title}\n\n${section.paragraphs.join('\n\n')}${section.points ? `\n\n${section.points.map((point) => `- ${point}`).join('\n')}` : ''}`).join('\n\n')}\n`;
}
