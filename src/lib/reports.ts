import {
  budgetLines,
  loanSummary,
  monthlyTotal,
  rateScenarios,
  rand,
  type Budget,
  type SavedReport,
} from './budget';
import { checklist, municipalityFor, type MunicipalProfile, type Property } from './data';
import crime from './crime-snapshot.json';
import { indicatorDefinitions, municipalSnapshot } from './municipal-evidence';
import { purchaseCosts, transferDutyEvidence, upfrontFields } from './purchase-costs';

export type ReportSnapshot = {
  version: 1;
  calculationVersion: 'ownership-v1';
  capturedAt: string;
  monthlyTotal: number;
  lines: ReturnType<typeof budgetLines>;
  loan: ReturnType<typeof loanSummary>;
  scenarios: ReturnType<typeof rateScenarios>;
  purchase: ReturnType<typeof purchaseCosts>;
  dutyEvidence: typeof transferDutyEvidence;
  municipality: MunicipalProfile | null;
  municipalRetrievedAt: string;
  municipalVerification: string;
  indicatorDefinitions: typeof indicatorDefinitions;
  crime: typeof crime | null;
  checklist: typeof checklist;
};

// Capture values AND source data, so later deployments cannot rewrite a saved PDF.
export function createReport(
  property: Property,
  budget: Budget,
  checked: number[],
  now = Date.now(),
): SavedReport {
  if (!isBudget(budget)) throw new RangeError('Invalid report budget');
  const capturedAt = new Date(now).toISOString();
  const datedBudget = {
    ...budget,
    acquisitionDate: budget.acquisitionDate ?? capturedAt.slice(0, 10),
  };
  return structuredClone({
    property,
    budget: datedBudget,
    checked,
    savedAt: capturedAt,
    snapshot: {
      version: 1,
      calculationVersion: 'ownership-v1',
      capturedAt,
      monthlyTotal: monthlyTotal(datedBudget),
      lines: budgetLines(datedBudget),
      loan: loanSummary(datedBudget),
      scenarios: rateScenarios(datedBudget),
      purchase: purchaseCosts(datedBudget, now),
      dutyEvidence: transferDutyEvidence,
      municipality: municipalityFor(property) ?? null,
      municipalRetrievedAt: municipalSnapshot.retrievedAt,
      municipalVerification: municipalSnapshot.verification,
      indicatorDefinitions,
      crime: property.id === 'observatory' ? crime : null,
      checklist,
    },
  });
}

export function reportSnapshot(report: SavedReport) {
  // Legacy saves never contained evidence. Make the fallback explicit in exports.
  return report.snapshot ?? createReport(report.property, report.budget, report.checked).snapshot!;
}

const object = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const amount = (v: unknown, max = 100000000) =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max;
export function isBudget(value: unknown): value is Budget {
  if (!object(value)) return false;
  return (
    ['price', 'rates', 'levy', 'utilities', 'insurance', 'maintenance', 'income'].every((key) =>
      amount(value[key]),
    ) &&
    amount(value.deposit, 100) &&
    amount(value.rate, 40) &&
    amount(value.years, 30) &&
    Number(value.years) >= 1 &&
    Number.isInteger(value.years) &&
    amount(value.commuteKm, 500) &&
    amount(value.workdays, 31) &&
    Number.isInteger(value.workdays) &&
    amount(value.costPerKm, 100) &&
    typeof value.destination === 'string' &&
    upfrontFields.every(({ key }) => value[key] === undefined || amount(value[key])) &&
    (value.acquisitionDate === undefined || typeof value.acquisitionDate === 'string') &&
    (value.transferDutyExempt === undefined || typeof value.transferDutyExempt === 'boolean')
  );
}

export function isProperty(p: unknown): p is Property {
  return (
    object(p) &&
    ['id', 'address', 'suburb', 'city', 'image'].every((key) => typeof p[key] === 'string') &&
    ['price', 'rates', 'levy', 'utilities'].every((key) => amount(p[key])) &&
    typeof p.lat === 'number' &&
    Number.isFinite(p.lat) &&
    Math.abs(p.lat) <= 90 &&
    typeof p.lng === 'number' &&
    Number.isFinite(p.lng) &&
    Math.abs(p.lng) <= 180 &&
    typeof p.example === 'boolean' &&
    Array.isArray(p.amenities) &&
    p.amenities.every(
      (a) =>
        object(a) &&
        typeof a.name === 'string' &&
        typeof a.source === 'string' &&
        ['health', 'transport', 'green', 'shop', 'school'].includes(String(a.category)) &&
        typeof a.lat === 'number' &&
        Number.isFinite(a.lat) &&
        typeof a.lng === 'number' &&
        Number.isFinite(a.lng),
    )
  );
}

export function restoreReports(raw: unknown): SavedReport[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((r): r is SavedReport => {
    if (!object(r) || !isProperty(r.property) || !isBudget(r.budget) || !Array.isArray(r.checked))
      return false;
    if (
      typeof r.savedAt !== 'string' ||
      !Number.isFinite(Date.parse(r.savedAt)) ||
      new Set(r.checked).size !== r.checked.length ||
      !r.checked.every((i) => Number.isInteger(i) && i >= 0 && i < checklist.length)
    )
      return false;
    if (r.snapshot === undefined) return true;
    // A partial or future snapshot must not be passed to PDF/comparison code.
    const s = r.snapshot;
    if (!object(s) || s.version !== 1 || s.calculationVersion !== 'ownership-v1') return false;
    try {
      const snapshot = s as unknown as ReportSnapshot;
      return (
        Number.isFinite(Date.parse(snapshot.capturedAt)) &&
        amount(snapshot.monthlyTotal, 1000000000) &&
        snapshot.lines.length === 7 &&
        snapshot.lines.every(
          (l) =>
            typeof l.label === 'string' &&
            typeof l.color === 'string' &&
            amount(l.value, 1000000000),
        ) &&
        snapshot.scenarios.length === 3 &&
        snapshot.scenarios.every(
          (s) =>
            amount(s.total, 1000000000) &&
            amount(s.bond) &&
            amount(s.rate, 42) &&
            amount(s.change) &&
            (s.incomeShare === null || amount(s.incomeShare, Number.MAX_VALUE)),
        ) &&
        ['principal', 'payment', 'totalRepaid', 'interest'].every((key) =>
          amount(snapshot.loan[key as keyof typeof snapshot.loan], 10000000000),
        ) &&
        amount(snapshot.purchase.knownSubtotal, 1000000000) &&
        amount(snapshot.purchase.deposit) &&
        (snapshot.purchase.duty === null || amount(snapshot.purchase.duty)) &&
        typeof snapshot.purchase.acquisitionDate === 'string' &&
        typeof snapshot.purchase.complete === 'boolean' &&
        Array.isArray(snapshot.purchase.missingQuotes) &&
        typeof snapshot.dutyEvidence.source === 'string' &&
        typeof snapshot.dutyEvidence.effectiveFrom === 'string' &&
        typeof snapshot.dutyEvidence.retrievedAt === 'string' &&
        typeof snapshot.municipalRetrievedAt === 'string' &&
        typeof snapshot.municipalVerification === 'string' &&
        Array.isArray(snapshot.indicatorDefinitions) &&
        snapshot.indicatorDefinitions.every(
          (d) =>
            typeof d.key === 'string' &&
            typeof d.label === 'string' &&
            typeof d.explanation === 'string',
        ) &&
        Array.isArray(snapshot.checklist) &&
        snapshot.checklist.every(
          (c) => typeof c.title === 'string' && typeof c.detail === 'string',
        ) &&
        (snapshot.municipality === null ||
          (Array.isArray(snapshot.municipality.evidence.audits) &&
            snapshot.indicatorDefinitions.every((d) => {
              const indicator = snapshot.municipality!.evidence.indicators[d.key];
              return typeof indicator.unit === 'string' && Array.isArray(indicator.values);
            }))) &&
        (snapshot.crime === null ||
          (Array.isArray(snapshot.crime.periods) &&
            Array.isArray(snapshot.crime.counts) &&
            Array.isArray(snapshot.crime.categories)))
      );
    } catch {
      return false;
    }
  });
}

export function comparisonRows(reports: SavedReport[]) {
  const snapshots = reports.map(reportSnapshot);
  const money = rand;
  return [
    ['Purchase assumption', ...reports.map((r) => money(r.budget.price))],
    ['Monthly total', ...snapshots.map((s) => money(s.monthlyTotal))],
    ['Monthly at rate +2 pp', ...snapshots.map((s) => money(s.scenarios[2].total))],
    [
      'Cash: entered costs + known duty',
      ...snapshots.map(
        (s) => `${money(s.purchase.knownSubtotal)}${s.purchase.complete ? '' : ' · incomplete'}`,
      ),
    ],
    [
      'Transfer duty',
      ...snapshots.map((s) => (s.purchase.duty === null ? 'Unresolved' : money(s.purchase.duty))),
    ],
    ...snapshots[0].lines.map((line, i) => [
      line.label,
      ...snapshots.map((s) => money(s.lines[i].value)),
    ]),
    ['Deposit', ...reports.map((r) => `${r.budget.deposit}%`)],
    ['Bond rate / term', ...reports.map((r) => `${r.budget.rate}% / ${r.budget.years} years`)],
    ['Municipality context', ...snapshots.map((s) => s.municipality?.name ?? 'Unresolved')],
    ['Municipal audit period', ...snapshots.map((s) => s.municipality?.year ?? 'Unavailable')],
    [
      'Crime reporting period',
      ...snapshots.map((s) => s.crime?.latestLabel ?? 'Station series unavailable'),
    ],
    [
      'Checklist remaining',
      ...reports.map((r, i) => `${snapshots[i].checklist.length - r.checked.length} checks`),
    ],
    ['Saved', ...reports.map((r) => r.savedAt.slice(0, 10))],
  ];
}
