import { brand } from './brand';
import { discoveryUrl } from './site';
import {
  methodologySections,
  ownershipSections,
  sectionsMarkdown,
  evidenceLinks,
} from './editorial';

export function homeMarkdown() {
  return `# ${brand.productName}\n\n> ${brand.description}\n\n${brand.name} is a property due-diligence companion for South African homebuyers. Enter an address, review local context, adjust your ownership-budget assumptions, save comparisons and export a PDF.\n\nThe current MVP is free early access. R99–R299 is the intended future per-report range; checkout is not connected.\n\nThe product covers bond repayments, rates, levies, utilities, insurance, maintenance and commute assumptions. It also provides maps and dated municipal and police-precinct evidence where a verified snapshot is available.\n\nExample property prices and bills are illustrative. Photos and the interactive architectural model are representative. No licensed valuation, deeds history, legal-title check, building survey or street-level safety prediction is provided.\n\nSaved reports stay in the visitor's browser. The public documentation contains no visitor addresses, financial inputs or saved reports.\n\n## Explore\n\n- [Product overview](${discoveryUrl('/')}): How it works, features and intended pricing.\n- [Report workspace](${discoveryUrl('/check/')}): An interactive browser-local tool; requires JavaScript and is marked noindex.\n- [Methodology](${discoveryUrl('/methodology/index.md')}): Formulas, sources, coverage, pricing and privacy.\n- [Ownership cost guide](${discoveryUrl('/guides/home-ownership-costs/index.md')}): A practical overview of monthly home-ownership costs.\n`;
}
export function methodologyMarkdown() {
  return `${sectionsMarkdown(`${brand.name}: data sources and report methodology`, 'How the report calculates costs and explains evidence, dates and limits.', methodologySections)}\n## Sources\n\n${evidenceLinks.map((link) => `- [${link.label}](${link.href})`).join('\n')}\n`;
}
export function ownershipMarkdown() {
  return `${sectionsMarkdown('The monthly cost of owning a home in South Africa', `A homebuyer’s budgeting guide from ${brand.name}.`, ownershipSections)}\n## Useful next steps\n\n- [Ownership budget](${discoveryUrl('/check/?tab=budget')}): Adjust the numbers using your own bills and quotes.\n- [Methodology](${discoveryUrl('/methodology/index.md')}): Sources, formulas and limits.\n- [SARS transfer-duty information](https://www.sars.gov.za/types-of-tax/transfer-duty/): Current primary-source tax information; tax and legal fees are not calculated by this MVP.\n`;
}
export function llmsIndex() {
  return `# ${brand.productName}\n\n> ${brand.description}\n\n${brand.name} is an independent buyer-oriented tool, not a property advertising platform. The current MVP is free early access. R99–R299 is intended future report pricing; no checkout or charges are connected.\n\nOwnership budgets use user assumptions, not licensed valuations or lender quotes. Police data describes a precinct and never measures a street’s safety. Municipal evidence is dated. Saved reports stay in the visitor’s browser and are not part of these public documents.\n\n## Product\n\n- [Product overview](${discoveryUrl('/index.md')}): Scope, workflow, intended pricing and current MVP status.\n- [Sources and methodology](${discoveryUrl('/methodology/index.md')}): Calculation formulas, data dates, coverage and privacy.\n- [South African ownership cost guide](${discoveryUrl('/guides/home-ownership-costs/index.md')}): Bond repayments, rates, levies, utilities, insurance, maintenance, commuting and once-off costs.\n\n## Optional\n\n- [Full product documentation](${discoveryUrl('/llms-full.txt')}): Combined plain-text product, methodology and ownership guide.\n- [Human-readable methodology](${discoveryUrl('/methodology/')}): The public source and methodology page.\n`;
}
export function llmsFull() {
  return `${homeMarkdown()}\n---\n\n${methodologyMarkdown()}\n---\n\n${ownershipMarkdown()}`;
}
export function markdownResponse(content: string) {
  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      Link: '</llms.txt>; rel="describedby"',
    },
  });
}
