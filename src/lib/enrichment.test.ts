import assert from 'node:assert/strict';
import { test } from 'node:test';
import { municipalities, municipalityFor } from './data';
import {
  financialYear,
  indicatorDisplay,
  municipalSnapshot,
  snapshotNeedsRefresh,
} from './municipal-evidence';
import { transferDuty, transferDutyEvidence } from './purchase-costs';

const now = Date.parse('2026-10-13T12:00:00Z');

test('all eight metros have attributed audit history and dated financial indicators', () => {
  assert.equal(municipalities.length, 8);
  assert.deepEqual(
    new Set(municipalities.map((row) => row.code)),
    new Set(['CPT', 'JHB', 'ETH', 'TSH', 'BUF', 'EKU', 'MAN', 'NMA']),
  );
  for (const metro of municipalities) {
    assert.match(metro.evidence.source, /^https:\/\/municipalmoney.gov.za\/profiles\//);
    assert.match(metro.evidence.sourceSha256, /^[a-f0-9]{64}$/);
    assert.ok(metro.evidence.audits.length >= 3);
    assert.equal(Object.keys(metro.evidence.indicators).length, 7);
    for (const indicator of Object.values(metro.evidence.indicators)) {
      assert.ok(indicator.values.length >= 2);
      for (const row of indicator.values)
        assert.ok(row.value === null || Number.isFinite(row.value));
    }
  }
  assert.match(municipalSnapshot.verification, /being verified/);
  assert.equal(municipalSnapshot.publicationDate, null);
});

test('city matches prefer exact labels and leave ambiguous suburbs unresolved', () => {
  const expected = {
    Gqeberha: 'nelson-mandela-bay',
    Bloemfontein: 'mangaung',
    'East London': 'buffalo-city',
    Benoni: 'ekurhuleni',
  };
  for (const [city, id] of Object.entries(expected))
    assert.equal(municipalityFor({ city, suburb: '' })?.id, id);
  for (const city of ['South Africa', 'New Johannesburg', 'Cape Townsville', 'Polokwane']) {
    assert.equal(municipalityFor({ city, suburb: 'Rosebank Menlo Sandton' }), undefined);
  }
  assert.equal(municipalityFor({ city: 'Cape Town', suburb: 'Rosebank' })?.id, 'cape-town');
  assert.equal(
    municipalityFor({ city: 'Johannesburg', suburb: 'Pretoria Street' })?.id,
    'johannesburg',
  );
});

test('missing observations and outliers remain visible instead of becoming scores', () => {
  assert.equal(indicatorDisplay(null, '%'), 'Not reported');
  assert.equal(indicatorDisplay(0, 'months'), '0.0 months');
  assert.equal(indicatorDisplay(-17.27, '%'), '-17.27%');
  assert.equal(financialYear(2024), '2023/24');
  for (const metro of Object.values(municipalSnapshot.municipalities)) {
    for (const key of ['repairs_maintenance_spending', 'current_debtors_collection_rate']) {
      for (const row of metro.indicators[key].values) {
        if (row.value !== null && (row.value < 0 || row.value > 100))
          assert.match(row.note ?? '', /verify/);
      }
    }
  }
});

test('retrieval freshness is independent of reporting year', () => {
  assert.equal(snapshotNeedsRefresh('2026-10-13', now), false);
  assert.equal(snapshotNeedsRefresh('2026-01-01', now), true);
  assert.equal(snapshotNeedsRefresh('bad-date', now), true);
});

test('SARS bracket boundaries, high-value band and zero taxable value', () => {
  const examples = [
    [0, 0],
    [1210000, 0],
    [1210001, 0.03],
    [1663800, 13614],
    [2329300, 53544],
    [2450000, 63200],
    [2994800, 106784],
    [13310000, 1241456],
    [15000000, 1461156],
  ];
  for (const [value, expected] of examples)
    assert.equal(transferDuty(value, '2026-10-13', now), expected);
  for (let i = 1; i < transferDutyEvidence.brackets.length; i++) {
    const prior = transferDutyEvidence.brackets[i - 1],
      current = transferDutyEvidence.brackets[i];
    assert.ok(
      Math.abs(prior.base + (current.above - prior.above) * prior.rate - current.base) < 0.01,
    );
  }
});

test('unsupported tax dates and stale tables yield no estimate', () => {
  for (const date of ['', 'invalid', '2026-02-30', '2026-03-31', '2026-12-01'])
    assert.equal(transferDuty(2450000, date, now), null);
  assert.equal(transferDuty(2450000, '2027-01-20', Date.parse('2027-01-20T12:00:00Z')), null);
  for (const value of [NaN, Infinity, -1])
    assert.throws(() => transferDuty(value, '2026-10-13', now), RangeError);
});
