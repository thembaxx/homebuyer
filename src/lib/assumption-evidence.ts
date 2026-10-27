import type { Budget } from './budget';

export const assumptionFields = [
  { key: 'price', label: 'Purchase price', unit: 'ZAR', max: 100000000 },
  { key: 'deposit', label: 'Deposit', unit: '%', max: 100 },
  { key: 'rate', label: 'Annual bond interest rate', unit: '%', max: 40 },
  { key: 'years', label: 'Bond term', unit: 'years', max: 30 },
  { key: 'rates', label: 'Monthly rates & taxes', unit: 'ZAR', max: 100000000 },
  { key: 'levy', label: 'Monthly levies', unit: 'ZAR', max: 100000000 },
  { key: 'utilities', label: 'Monthly utilities', unit: 'ZAR', max: 100000000 },
  { key: 'insurance', label: 'Monthly home insurance', unit: 'ZAR', max: 100000000 },
  { key: 'maintenance', label: 'Monthly maintenance reserve', unit: 'ZAR', max: 100000000 },
  { key: 'income', label: 'Monthly take-home household income', unit: 'ZAR', max: 100000000 },
  { key: 'commuteKm', label: 'One-way commute distance', unit: 'km', max: 500 },
  { key: 'workdays', label: 'Workdays per month', unit: 'days', max: 31 },
  { key: 'costPerKm', label: 'Commute cost per kilometre', unit: 'ZAR/km', max: 100 },
  { key: 'transferFees', label: 'Transfer attorney quote', unit: 'ZAR', max: 100000000 },
  { key: 'bondFees', label: 'Bond registration quote', unit: 'ZAR', max: 100000000 },
  { key: 'movingCosts', label: 'Moving quote', unit: 'ZAR', max: 100000000 },
  { key: 'immediateRepairs', label: 'Immediate repairs quote', unit: 'ZAR', max: 100000000 },
  { key: 'otherUpfront', label: 'Other upfront costs', unit: 'ZAR', max: 100000000 },
] as const;

export type AssumptionKey = (typeof assumptionFields)[number]['key'];
export type AssumptionEvidence = {
  id: string;
  assumption: AssumptionKey;
  sourceLabel: string;
  sourceDate: string;
  reference: string;
  excerpt: string;
  supportedValue: number;
};

export const MAX_ASSUMPTION_EVIDENCE = 40;

function boundedText(value: unknown, max: number) {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= max &&
    !Array.from(value).some((character) => {
      const code = character.charCodeAt(0);
      return (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127;
    })
  );
}

function sourceDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function isAssumptionEvidence(value: unknown): value is AssumptionEvidence {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const field = assumptionFields.find((candidate) => candidate.key === record.assumption);
  return (
    !!field &&
    boundedText(record.id, 80) &&
    boundedText(record.sourceLabel, 160) &&
    sourceDate(record.sourceDate) &&
    boundedText(record.reference, 500) &&
    boundedText(record.excerpt, 2000) &&
    typeof record.supportedValue === 'number' &&
    Number.isFinite(record.supportedValue) &&
    record.supportedValue >= (field.key === 'years' ? 1 : 0) &&
    record.supportedValue <= field.max &&
    (!['years', 'workdays'].includes(field.key) || Number.isInteger(record.supportedValue))
  );
}

/** Missing evidence is valid for older reports; malformed evidence never silently replaces it. */
export function parseAssumptionEvidence(value: unknown): AssumptionEvidence[] {
  if (value === undefined) return [];
  if (
    !Array.isArray(value) ||
    value.length > MAX_ASSUMPTION_EVIDENCE ||
    !value.every(isAssumptionEvidence) ||
    new Set(value.map((record) => record.id)).size !== value.length
  )
    throw new Error('The assumption evidence is incomplete or unsupported.');
  return value.map((record) => ({
    id: record.id,
    assumption: record.assumption,
    sourceLabel: record.sourceLabel.trim(),
    sourceDate: record.sourceDate,
    reference: record.reference.trim(),
    excerpt: record.excerpt.trim(),
    supportedValue: record.supportedValue,
  }));
}

export function evidenceNeedsReview(evidence: AssumptionEvidence, budget: Budget) {
  return budget[evidence.assumption] !== evidence.supportedValue;
}

export function assumptionValue(value: number | undefined, unit: string) {
  return value === undefined
    ? 'Not entered'
    : `${value.toLocaleString('en-ZA', { maximumFractionDigits: 2 })} ${unit}`;
}

/** Plain text only: references are printed as supplied, never fetched or executed. */
export function assumptionEvidenceReport(value: unknown, budget: Budget): string {
  const evidence = parseAssumptionEvidence(value);
  const lines = [
    'BUDGET ASSUMPTION EVIDENCE',
    'User-recorded sources; not independently verified. Compare each original document and its billing period.',
  ];
  for (const item of evidence) {
    const field = assumptionFields.find((candidate) => candidate.key === item.assumption)!;
    lines.push(
      '',
      `${field.label}: ${assumptionValue(item.supportedValue, field.unit)}`,
      `Current assumption: ${assumptionValue(budget[item.assumption], field.unit)}. ${evidenceNeedsReview(item, budget) ? 'REVIEW: the current figure differs from this source record.' : 'Matches the entered figure; source remains user-recorded.'}`,
      `Source: ${item.sourceLabel} | Document date: ${item.sourceDate}`,
      `Reference: ${item.reference}`,
      `Excerpt: ${item.excerpt}`,
    );
  }
  const unknown = assumptionFields.filter(
    (field) => !evidence.some((item) => item.assumption === field.key),
  );
  if (unknown.length)
    lines.push('', `No source recorded: ${unknown.map((field) => field.label).join('; ')}.`);
  return lines.join('\n');
}
