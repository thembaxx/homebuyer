'use client';

import { ArrowUpRight, Receipt } from '@phosphor-icons/react';
import { rand, type Budget } from '@/lib/budget';
import { transferDuty, transferDutyEvidence } from '@/lib/purchase-costs';

export function PurchaseCostsPanel({
  budget,
  onChange,
  now,
}: {
  budget: Budget;
  onChange: (budget: Budget) => void;
  now: number | null;
}) {
  const { price, deposit } = budget;
  const acquisitionDate =
    budget.acquisitionDate ?? (now === null ? '' : new Date(now).toISOString().slice(0, 10));
  const exempt = budget.transferDutyExempt ?? false;
  const duty = now === null || exempt ? null : transferDuty(price, acquisitionDate, now);
  return (
    <section className="panel purchase-costs-panel">
      <div className="panel-heading">
        <div>
          <span className="micro-label">BEFORE THE KEYS</span>
          <h2>Deposit & transfer duty</h2>
        </div>
        <Receipt size={25} />
      </div>
      <p>
        A separate once-off estimate, using your purchase price as the assumed taxable value. Keep
        this outside your monthly budget.
      </p>
      <div className="purchase-controls">
        <label htmlFor="acquisition-date">
          Acquisition agreement date
          <input
            id="acquisition-date"
            type="date"
            value={acquisitionDate}
            max={now === null ? undefined : new Date(now).toISOString().slice(0, 10)}
            onChange={(event) => onChange({ ...budget, acquisitionDate: event.target.value })}
          />
        </label>
        <label className="exemption-control">
          <input
            type="checkbox"
            checked={exempt}
            onChange={(event) => onChange({ ...budget, transferDutyExempt: event.target.checked })}
          />
          VAT transaction or another possible exemption
        </label>
      </div>
      <div className="compact-row">
        <span>Your deposit</span>
        <strong>{rand((price * deposit) / 100)}</strong>
      </div>
      <div className="compact-row">
        <span>Estimated transfer duty</span>
        <strong>{duty === null ? 'Confirm with conveyancer' : rand(duty)}</strong>
      </div>
      {duty !== null && (
        <div className="compact-row">
          <span>Deposit + duty subtotal</span>
          <strong>{rand((price * deposit) / 100 + duty)}</strong>
        </div>
      )}
      {duty === null && (
        <p className="panel-note" role="status">
          {exempt
            ? 'Confirm the exemption and any VAT with your conveyancer. No duty estimate is applied.'
            : 'An estimate needs a valid acquisition date from 1 April 2026 through today and a snapshot retrieved within 90 days. Check SARS for the applicable table.'}
        </p>
      )}
      <p className="panel-note">
        SARS table effective {transferDutyEvidence.effectiveFrom}; source updated{' '}
        {transferDutyEvidence.sourceUpdatedAt}; retrieved {transferDutyEvidence.retrievedAt}.{' '}
        {transferDutyEvidence.note} Conveyancing, bond registration, moving and other fees need
        separate quotes; this subtotal is not your full cash requirement.
      </p>
      <a
        href={transferDutyEvidence.source}
        target="_blank"
        rel="noreferrer"
        className="source-link"
      >
        SARS · transfer-duty brackets
        <ArrowUpRight size={16} />
      </a>
    </section>
  );
}
