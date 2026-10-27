'use client';

import { useId, useState, type FormEvent } from 'react';
import type { Budget } from '@/lib/budget';
import {
  assumptionFields,
  assumptionValue,
  evidenceNeedsReview,
  isAssumptionEvidence,
  MAX_ASSUMPTION_EVIDENCE,
  type AssumptionEvidence,
  type AssumptionKey,
} from '@/lib/assumption-evidence';

type Draft = Omit<AssumptionEvidence, 'supportedValue'> & { supportedValue: string };
const emptyDraft = (): Draft => ({
  id: '',
  assumption: 'rates',
  sourceLabel: '',
  sourceDate: '',
  reference: '',
  excerpt: '',
  supportedValue: '',
});

export function AssumptionEvidencePanel({
  budget,
  value,
  onChange,
}: {
  budget: Budget;
  value: AssumptionEvidence[];
  onChange: (evidence: AssumptionEvidence[]) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [preview, setPreview] = useState<AssumptionEvidence | null>(null);
  const [message, setMessage] = useState('');
  const field = assumptionFields.find((candidate) => candidate.key === draft.assumption)!;
  const unknown = assumptionFields.filter(
    (candidate) => !value.some((item) => item.assumption === candidate.key),
  );
  const change = <Key extends keyof Draft>(key: Key, next: Draft[Key]) => {
    setDraft((current) => ({ ...current, [key]: next }));
    setPreview(null);
    setMessage('');
  };
  function prepare(event: FormEvent) {
    event.preventDefault();
    const candidate = {
      ...draft,
      id: draft.id || crypto.randomUUID(),
      sourceLabel: draft.sourceLabel.trim(),
      reference: draft.reference.trim(),
      excerpt: draft.excerpt.trim(),
      supportedValue: Number(draft.supportedValue),
    };
    if (!draft.supportedValue.trim() || !isAssumptionEvidence(candidate)) {
      setMessage('Complete every source field and check the figure and document date.');
      return;
    }
    if (!draft.id && value.length >= MAX_ASSUMPTION_EVIDENCE) {
      setMessage(`Keep up to ${MAX_ASSUMPTION_EVIDENCE} source records per home.`);
      return;
    }
    setPreview(candidate);
    setMessage('Compare this preview with the original document, then save the source record.');
  }
  function save() {
    if (!preview) return;
    const next = value.some((item) => item.id === preview.id)
      ? value.map((item) => (item.id === preview.id ? preview : item))
      : [...value, preview];
    if (next.length > MAX_ASSUMPTION_EVIDENCE) {
      setMessage(`Keep up to ${MAX_ASSUMPTION_EVIDENCE} source records per home.`);
      return;
    }
    onChange(next);
    setDraft(emptyDraft());
    setPreview(null);
    setMessage('Source record added to this report. Save the home to keep your changes.');
  }
  return (
    <section className="panel municipal-panel" aria-labelledby={`${id}-title`}>
      <span className="tag muted">YOUR DOCUMENTS & QUOTES</span>
      <h2 id={`${id}-title`}>Evidence behind your numbers</h2>
      <p className="panel-note">
        Record a quote, bill or viewing observation beside the figure it supports. Original files
        stay with you. References and excerpts are saved with this report; they are never uploaded
        or independently verified.
      </p>
      <details className="evidence-history">
        <summary>{unknown.length} assumptions without a recorded source</summary>
        <ul>
          {unknown.map((candidate) => (
            <li key={candidate.key}>
              <strong>{candidate.label}</strong>
              <span>{assumptionValue(budget[candidate.key], candidate.unit)}</span>
            </li>
          ))}
        </ul>
      </details>
      {value.length === 0 && <p>No source records yet. Entered figures remain assumptions.</p>}
      {value.map((item) => {
        const itemField = assumptionFields.find((candidate) => candidate.key === item.assumption)!;
        return (
          <article className="municipal-indicator" key={item.id}>
            <div>
              <strong>{itemField.label}</strong>
              <span>{assumptionValue(item.supportedValue, itemField.unit)}</span>
            </div>
            <p>
              {item.sourceLabel} · {item.sourceDate}
            </p>
            {evidenceNeedsReview(item, budget) ? (
              <p className="evidence-warning">
                Review needed: the current figure is{' '}
                {assumptionValue(budget[item.assumption], itemField.unit)}. This source record
                supports a different figure.
              </p>
            ) : (
              <p className="panel-note">Matches your entered figure. Source is user-recorded.</p>
            )}
            <p>{item.excerpt}</p>
            <p className="panel-note">Reference: {item.reference}</p>
            <div className="input-pair">
              <button
                className="button"
                type="button"
                onClick={() => {
                  setDraft({ ...item, supportedValue: String(item.supportedValue) });
                  setPreview(null);
                  setMessage('Edit the source record below, then preview it.');
                }}
              >
                Edit {itemField.label.toLowerCase()} source
              </button>
              <button
                className="button"
                type="button"
                onClick={() => {
                  onChange(value.filter((record) => record.id !== item.id));
                  if (draft.id === item.id) {
                    setDraft(emptyDraft());
                    setPreview(null);
                  }
                  setMessage('Source record removed. Save the home to keep this change.');
                }}
              >
                Remove {itemField.label.toLowerCase()} source
              </button>
            </div>
          </article>
        );
      })}
      <form className="budget-editor" onSubmit={prepare}>
        <h3>{draft.id ? 'Edit a source record' : 'Add a source record'}</h3>
        <label className="number-field">
          <span>Budget assumption</span>
          <select
            className="plain-input"
            value={draft.assumption}
            onChange={(event) => change('assumption', event.target.value as AssumptionKey)}
          >
            {assumptionFields.map((candidate) => (
              <option value={candidate.key} key={candidate.key}>
                {candidate.label}
              </option>
            ))}
          </select>
        </label>
        <div className="input-pair">
          <label className="number-field">
            <span>Figure supported by the source ({field.unit})</span>
            <input
              className="plain-input"
              type="number"
              required
              min={field.key === 'years' ? 1 : 0}
              max={field.max}
              step={['years', 'workdays'].includes(field.key) ? '1' : 'any'}
              value={draft.supportedValue}
              onChange={(event) => change('supportedValue', event.target.value)}
            />
          </label>
          <label className="number-field">
            <span>Document or observation date</span>
            <input
              className="plain-input"
              type="date"
              required
              value={draft.sourceDate}
              onChange={(event) => change('sourceDate', event.target.value)}
            />
          </label>
        </div>
        <p className="panel-note">
          Current figure: {assumptionValue(budget[draft.assumption], field.unit)}. Recording
          evidence does not change your budget.
        </p>
        <label className="number-field">
          <span>Source label</span>
          <input
            className="plain-input"
            required
            maxLength={160}
            placeholder="For example, seller’s October rates statement"
            value={draft.sourceLabel}
            onChange={(event) => change('sourceLabel', event.target.value)}
          />
        </label>
        <label className="number-field">
          <span>Document, page or quote reference</span>
          <input
            className="plain-input"
            required
            maxLength={500}
            placeholder="For example, quote ABC123, page 2"
            value={draft.reference}
            onChange={(event) => change('reference', event.target.value)}
          />
        </label>
        <label className="number-field">
          <span>Quoted passage or viewing observation</span>
          <textarea
            className="plain-input"
            required
            maxLength={2000}
            rows={4}
            value={draft.excerpt}
            onChange={(event) => change('excerpt', event.target.value)}
          />
        </label>
        <div className="input-pair">
          <button className="button dark" type="submit">
            Preview source record
          </button>
          {draft.id && (
            <button
              className="button"
              type="button"
              onClick={() => {
                setDraft(emptyDraft());
                setPreview(null);
                setMessage('Editing cancelled.');
              }}
            >
              Cancel editing
            </button>
          )}
        </div>
      </form>
      {preview && (
        <section className="municipal-indicator" aria-label="Source record preview">
          <h3>Review before saving</h3>
          <p>
            <strong>{field.label}</strong>: {assumptionValue(preview.supportedValue, field.unit)}
          </p>
          <p>
            {preview.sourceLabel} · {preview.sourceDate}
          </p>
          <p>{preview.excerpt}</p>
          <p className="panel-note">Reference: {preview.reference}</p>
          {evidenceNeedsReview(preview, budget) && (
            <p className="evidence-warning">
              This differs from your entered figure. Review your budget separately.
            </p>
          )}
          <button className="button dark" type="button" onClick={save}>
            Save reviewed source record
          </button>
        </section>
      )}
      <p className="panel-note" role="status">
        {message}
      </p>
    </section>
  );
}
