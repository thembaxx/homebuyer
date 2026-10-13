import duty from './transfer-duty-snapshot.json';
import { snapshotNeedsRefresh } from './municipal-evidence';

export const transferDutyEvidence = duty;

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
