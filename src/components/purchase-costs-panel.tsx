'use client';

import { ArrowUpRight, Receipt } from '@phosphor-icons/react';
import { rand, type Budget } from '@/lib/budget';
import { purchaseCosts, transferDutyEvidence, upfrontFields } from '@/lib/purchase-costs';

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
  const costs = now === null ? null : purchaseCosts(budget, now);
  const duty = costs?.duty ?? null;
  return (
    <section className="panel purchase-costs-panel">
      <div className="panel-heading">
        <div>
          <span className="micro-label">BEFORE THE KEYS</span>
          <h2>Plan your upfront cash</h2>
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
      <fieldset className="upfront-quotes">
        <legend>Add your written quotes</legend>
        <p className="panel-note">
          Enter totals including VAT where charged. Leave unknown amounts blank; enter 0 only when
          confirmed not applicable. Keep transfer duty outside these fees to avoid counting it
          twice.
        </p>
        <div className="input-pair">
          {upfrontFields.map(({ key, label }) => (
            <label className="number-field" key={key}>
              <span>{label}</span>
              <div>
                <span>R</span>
                <input
                  type="number"
                  min="0"
                  max="100000000"
                  step="any"
                  name={key}
                  placeholder="Quote needed"
                  value={budget[key] ?? ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : Number(e.target.value);
                    if (
                      value === undefined ||
                      (Number.isFinite(value) && value >= 0 && value <= 100000000)
                    )
                      onChange({ ...budget, [key]: value });
                  }}
                />
              </div>
            </label>
          ))}
        </div>
      </fieldset>
      {costs && (
        <>
          <div className="compact-row upfront-total">
            <span>
              {costs.complete ? 'Estimated upfront cash' : 'Known upfront subtotal · incomplete'}
            </span>
            <strong>{rand(costs.knownSubtotal)}</strong>
          </div>
          {!costs.complete && (
            <p className="panel-note" role="status">
              Still needed:{' '}
              {[
                ...(duty === null ? ['confirmed transfer duty / tax treatment'] : []),
                ...costs.missingQuotes,
              ].join(', ')}
              . The subtotal includes only your deposit, available duty and entered amounts.
            </p>
          )}
        </>
      )}
      <p className="panel-note">
        SARS table effective {transferDutyEvidence.effectiveFrom}; source updated{' '}
        {transferDutyEvidence.sourceUpdatedAt}; retrieved {transferDutyEvidence.retrievedAt}.{' '}
        {transferDutyEvidence.note} Conveyancing, bond registration, moving and other fees need
        separate quotes. Allow for additional costs identified by your conveyancer or inspector.
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
