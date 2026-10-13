'use client';
import { useState } from 'react';
import { Check, Info } from '@phosphor-icons/react';
import { type Budget, monthlyTotal, rand } from '@/lib/budget';

type NumericBudgetKey = {
  [Key in keyof Budget]: Budget[Key] extends number ? Key : never;
}[keyof Budget] &
  string;

export function BudgetEditor({ value, onSave }: { value: Budget; onSave: (b: Budget) => void }) {
  const [draft, setDraft] = useState(value);
  const update = <Key extends keyof Budget>(key: Key, value: Budget[Key]) =>
    setDraft((v) => ({ ...v, [key]: value }));
  const number = (key: NumericBudgetKey, label: string, min = 0, max = 10000000, step = 50) => (
    <label className="number-field" key={key}>
      <span>{label}</span>
      <div>
        <span>
          {['rate', 'deposit', 'years', 'commuteKm', 'workdays', 'costPerKm'].includes(key)
            ? ''
            : 'R'}
        </span>
        <input
          type="number"
          name={key}
          value={draft[key]}
          min={min}
          max={max}
          step={step === 1 ? 1 : 'any'}
          required
          onChange={(e) => update(key, e.target.value === '' ? 0 : Number(e.target.value))}
        />
        <span>{key === 'years' ? 'years' : key === 'commuteKm' ? 'km' : ''}</span>
      </div>
    </label>
  );
  return (
    <form
      className="budget-editor"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
    >
      <div className="editor-total">
        <span>Your estimated monthly cost</span>
        <strong>{rand(monthlyTotal(draft))}</strong>
      </div>
      <div className="editor-section">
        <h3>The home & the bond</h3>
        {number('price', 'Purchase price', 0, 100000000, 1000)}
        <div className="range-field">
          <label htmlFor="deposit">
            Deposit{' '}
            <strong>
              {draft.deposit}% · {rand((draft.price * draft.deposit) / 100)}
            </strong>
          </label>
          <input
            id="deposit"
            type="range"
            value={draft.deposit}
            min={0}
            max={100}
            step={1}
            onChange={(e) => update('deposit', Number(e.target.value))}
          />
        </div>
        <div className="input-pair">
          {number('rate', 'Annual interest rate (%)', 0, 40, 0.05)}
          {number('years', 'Bond term', 1, 30, 1)}
        </div>
      </div>
      <div className="editor-section">
        <h3>
          Life after the keys <small>Monthly amounts</small>
        </h3>
        <div className="input-pair">
          {number('rates', 'Rates & taxes')}
          {number('levy', 'Levies')}
          {number('utilities', 'Water, power & other utilities')}
          {number('insurance', 'Home insurance')}
          {number('maintenance', 'Maintenance reserve')}
          {number('income', 'Take-home household income')}
        </div>
      </div>
      <div className="editor-section">
        <h3>
          Your commute <small>Your assumptions</small>
        </h3>
        <label className="number-field">
          <span>Destination</span>
          <input
            className="plain-input"
            value={draft.destination}
            maxLength={120}
            onChange={(e) => update('destination', e.target.value)}
          />
        </label>
        <div className="input-pair">
          {number('commuteKm', 'One-way distance', 0, 500, 0.5)}
          {number('workdays', 'Workdays per month', 0, 31, 1)}
          {number('costPerKm', 'Fuel & wear per km (R)', 0, 100, 0.1)}
        </div>
      </div>
      <p className="data-note">
        <Info size={17} />
        Use actual bills and a lender quote. Transfer and registration costs are excluded. Changing
        the price does not automatically change your maintenance reserve.
      </p>
      <button className="button dark" type="submit">
        Use these numbers <Check size={20} />
      </button>
    </form>
  );
}
