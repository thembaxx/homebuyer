import snapshot from './municipal-snapshot.json';

export type IndicatorValue = { year: number; value: number | null; note: string | null };
export type MunicipalEvidence = {
  code: string;
  name: string;
  province: string;
  source: string;
  sourceSha256: string;
  publisherUpdate: string;
  audits: { year: number; code: string; label: string; reportUrl: string | null }[];
  indicators: Record<string, { unit: string; formula: string | null; values: IndicatorValue[] }>;
};

export const municipalSnapshot = snapshot as Omit<typeof snapshot, 'municipalities'> & {
  municipalities: Record<string, MunicipalEvidence>;
};

export const indicatorDefinitions = [
  {
    key: 'cash_balance',
    label: 'Cash at year end',
    explanation: 'Cash available to the municipality at the end of the financial year.',
  },
  {
    key: 'cash_coverage',
    label: 'Cash coverage',
    explanation: 'Months of operating expenses covered by cash reserves.',
  },
  {
    key: 'current_ratio',
    label: 'Current assets / liabilities',
    explanation: 'Short-term assets divided by short-term liabilities.',
  },
  {
    key: 'current_debtors_collection_rate',
    label: 'Revenue collected',
    explanation: 'Collected revenue as a share of billed revenue; not this property’s account.',
  },
  {
    key: 'operating_budget_spending',
    label: 'Operating budget variance',
    explanation:
      'Actual spending compared with the budget. Negative means underspending; positive means overspending.',
  },
  {
    key: 'capital_budget_spending',
    label: 'Capital budget variance',
    explanation:
      'Infrastructure spending compared with the capital budget. Negative means underspending.',
  },
  {
    key: 'repairs_maintenance_spending',
    label: 'Repairs & maintenance',
    explanation:
      'Expenditure as a share of fixed assets and investment property; not household repair costs.',
  },
];

export function financialYear(year: number) {
  return `${year - 1}/${String(year).slice(-2)}`;
}

export function indicatorDisplay(value: number | null, unit: string) {
  if (value === null) return 'Not reported';
  if (unit === 'R') return `R${Math.round(value).toLocaleString('en-ZA')}`;
  if (unit === 'months') return `${value.toFixed(1)} months`;
  if (unit === 'ratio') return `${value.toFixed(2)}×`;
  return `${value.toFixed(2)}%`;
}

export function snapshotNeedsRefresh(retrievedAt: string, now = Date.now(), maxDays = 90) {
  const retrieved = Date.parse(`${retrievedAt}T00:00:00Z`);
  return !Number.isFinite(retrieved) || now - retrieved > maxDays * 86_400_000;
}
