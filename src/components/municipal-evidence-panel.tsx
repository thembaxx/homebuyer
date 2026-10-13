'use client';

import { ArrowUpRight, Buildings, CheckCircle, Info } from '@phosphor-icons/react';
import { municipalityFor, type Property } from '@/lib/data';
import {
  financialYear,
  indicatorDefinitions,
  indicatorDisplay,
  municipalSnapshot,
  snapshotNeedsRefresh,
} from '@/lib/municipal-evidence';

export function MunicipalEvidencePanel({
  property,
  now,
}: {
  property: Property;
  now: number | null;
}) {
  const profile = municipalityFor(property);
  const evidence = profile?.evidence;
  return (
    <section className="panel municipal-panel">
      <div className="panel-heading">
        <span className="panel-icon">
          <Buildings size={25} />
        </span>
        <span className="tag muted">MUNICIPAL FINANCES</span>
      </div>
      <h2>{profile?.name || 'Your municipality'}</h2>
      {profile && evidence ? (
        <>
          <div className={`audit-result ${profile.tone}`}>
            {profile.tone === 'clean' ? (
              <CheckCircle size={23} weight="fill" />
            ) : (
              <Info size={23} />
            )}
            <strong>{profile.opinionLabel}</strong>
            <span>{profile.year}</span>
          </div>
          <p>{profile.summary}</p>
          {!property.example && (
            <p className="panel-note">
              Matched from the address’s city label. Confirm the municipal boundary against the
              seller’s account.
            </p>
          )}
          <details className="evidence-history">
            <summary>Audit history & original reports</summary>
            <ul>
              {evidence.audits.map((audit) => (
                <li key={audit.year}>
                  <strong>{financialYear(audit.year)}</strong>
                  {audit.reportUrl ? (
                    <a href={audit.reportUrl} target="_blank" rel="noreferrer">
                      {audit.label}
                      <ArrowUpRight size={14} />
                    </a>
                  ) : (
                    <span>{audit.label} · report unavailable</span>
                  )}
                </li>
              ))}
            </ul>
          </details>
          <h3 className="evidence-subheading">Financial health in context</h3>
          <div className="municipal-indicators">
            {indicatorDefinitions.map(({ key, label, explanation }) => {
              const indicator = evidence.indicators[key];
              const latest = indicator.values[0];
              return (
                <div className="municipal-indicator" key={key}>
                  <div>
                    <strong>{label}</strong>
                    <span>{indicatorDisplay(latest?.value ?? null, indicator.unit)}</span>
                  </div>
                  <small>
                    {latest ? `FY ${financialYear(latest.year)}` : 'No reporting period available'}
                  </small>
                  <p>{explanation}</p>
                  {latest?.note && <p className="evidence-warning">{latest.note}</p>}
                  {indicator.values.length > 1 && (
                    <details className="evidence-history">
                      <summary>Previous reporting years</summary>
                      <ul>
                        {indicator.values.slice(1).map((row) => (
                          <li key={row.year}>
                            <strong>{financialYear(row.year)}</strong>
                            <span>
                              {indicatorDisplay(row.value, indicator.unit)}
                              {row.note ? ' · verify source value' : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
          <p className="panel-note">
            National Treasury · publisher update: {evidence.publisherUpdate}. Retrieved{' '}
            {municipalSnapshot.retrievedAt}. The publisher does not supply an exact publication
            date.
          </p>
          {now !== null && snapshotNeedsRefresh(municipalSnapshot.retrievedAt, now) && (
            <p className="evidence-warning" role="status">
              This snapshot was retrieved more than 90 days ago. Check the source for updates.
            </p>
          )}
          <p className="panel-note">
            {municipalSnapshot.verification} An audit does not guarantee services or future
            municipal performance.
          </p>
          <a href={evidence.source} target="_blank" rel="noreferrer" className="source-link">
            National Treasury · figures & calculation formulas
            <ArrowUpRight size={16} />
          </a>
        </>
      ) : (
        <>
          <div className="audit-result">
            <Info size={23} />
            <strong>Confirm your municipality</strong>
          </div>
          <p>
            No municipal snapshot is matched to this city label. Coverage includes all eight metros.
            Check the seller’s municipal account and National Treasury.
          </p>
          <a
            href="https://municipalmoney.gov.za/"
            target="_blank"
            rel="noreferrer"
            className="source-link"
          >
            Explore National Treasury Municipal Money
            <ArrowUpRight size={16} />
          </a>
        </>
      )}
    </section>
  );
}
