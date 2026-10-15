'use client';

import { useState } from 'react';
import { FilePdf } from '@phosphor-icons/react';
import type { SavedReport } from '@/lib/budget';
import { comparisonRows } from '@/lib/reports';

export function PropertyComparison({
  reports,
  exporting,
  onExport,
}: {
  reports: SavedReport[];
  exporting: boolean;
  onExport: (reports: SavedReport[]) => void;
}) {
  const [selected, setSelected] = useState(reports.slice(0, 3).map((r) => r.property.id));
  const active = reports.filter((r) => selected.includes(r.property.id));
  return (
    <section className="comparison-panel">
      <fieldset className="comparison-picker">
        <legend>Choose two or three homes</legend>
        {reports.map((r) => (
          <label key={r.property.id}>
            <input
              type="checkbox"
              checked={selected.includes(r.property.id)}
              disabled={!selected.includes(r.property.id) && active.length >= 3}
              onChange={(e) =>
                setSelected((v) =>
                  e.target.checked ? [...v, r.property.id] : v.filter((id) => id !== r.property.id),
                )
              }
            />
            <span>
              {r.property.address}
              <small>
                {r.property.suburb}, {r.property.city}
              </small>
            </span>
          </label>
        ))}
      </fieldset>
      {active.length < 2 ? (
        <p className="panel-note" role="status">
          Select at least two homes to compare their costs and outstanding checks.
        </p>
      ) : (
        <>
          <div className="comparison-scroll">
            <table>
              <caption>The cost and checks, side by side</caption>
              <thead>
                <tr>
                  <th scope="col">YOUR SHORTLIST</th>
                  {active.map((r) => (
                    <th scope="col" key={r.property.id}>
                      <strong>{r.property.address}</strong>
                      <small>{r.property.suburb}</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows(active).map((row, i) => (
                  <tr key={row[0]} className={i === 1 ? 'comparison-total' : ''}>
                    {row.map((cell, j) =>
                      j === 0 ? (
                        <th scope="row" key={j}>
                          {cell}
                        </th>
                      ) : (
                        <td key={j}>{cell}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="button dark" onClick={() => onExport(active)} disabled={exporting}>
            <FilePdf size={18} />
            Export comparison PDF
          </button>
        </>
      )}
      <p className="panel-note">
        Each home uses its saved inputs and evidence date. “Incomplete” means some upfront quotes or
        tax treatment are unresolved. Rate changes are percentage points (pp). Check different
        deposits, rates and income assumptions before comparing totals. No valuation or safety
        ranking is implied.
      </p>
      {active.some((r) => !r.snapshot) && (
        <p className="panel-note">
          Older saves have no frozen evidence. Their calculations use current sources; open and
          update them to capture a snapshot.
        </p>
      )}
    </section>
  );
}
