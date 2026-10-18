import duty from './transfer-duty-snapshot.json';
import { snapshotNeedsRefresh } from './municipal-evidence';
import type { Budget } from './budget';

export const transferDutyEvidence = duty;

export const upfrontFields = [
  { key: 'transferFees', label: 'Conveyancing & transfer fees' },
  { key: 'bondFees', label: 'Bond registration & lender fees' },
  { key: 'movingCosts', label: 'Moving costs' },
  { key: 'immediateRepairs', label: 'Immediate repairs' },
  { key: 'otherUpfront', label: 'Other upfront costs / applicable VAT' },
] as const;

export function purchaseCosts(b: Budget, now = Date.now()) {
  const acquisitionDate = b.acquisitionDate ?? new Date(now).toISOString().slice(0, 10);
  const deposit = (b.price * b.deposit) / 100;
  const duty = b.transferDutyExempt ? null : transferDuty(b.price, acquisitionDate, now);
  const missingQuotes = upfrontFields
    .filter(({ key }) => b[key] === undefined)
    .map(({ label }) => label);
  const quotedCosts = upfrontFields.reduce((sum, { key }) => sum + (b[key] ?? 0), 0);
  return {
    acquisitionDate,
    deposit,
    duty,
    quotedCosts,
    missingQuotes,
    knownSubtotal: deposit + (duty ?? 0) + quotedCosts,
    complete: duty !== null && missingQuotes.length === 0,
  };
}

// The date belongs to the acquisition agreement, not registration or moving day.
export function transferDuty(taxableValue: number, acquisitionDate: string, now = Date.now()) {
  if (!Number.isFinite(taxableValue) || taxableValue < 0)
    throw new RangeError('Invalid taxable value');
  if (typeof acquisitionDate !== 'string') return null;
  const date = Date.parse(`${acquisitionDate}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(acquisitionDate) ||
    !Number.isFinite(date) ||
    new Date(date).toISOString().slice(0, 10) !== acquisitionDate ||
    acquisitionDate < duty.effectiveFrom ||
    date > now ||
    snapshotNeedsRefresh(duty.retrievedAt, now)
  )
    return null;
  const bracket = duty.brackets.findLast((row) => taxableValue > row.above) ?? duty.brackets[0];
  return Math.round((bracket.base + (taxableValue - bracket.above) * bracket.rate) * 100) / 100;
}
