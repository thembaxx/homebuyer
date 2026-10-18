import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bondPayment, defaultBudget, loanSummary, rateScenarios, rand } from './budget';
import { checklist, properties } from './data';
import { purchaseCosts } from './purchase-costs';
import { comparisonRows, createReport, isBudget, reportSnapshot, restoreReports } from './reports';
import { buildReportDocument } from './pdf';

const now = Date.parse('2026-10-14T12:00:00Z');
const budget = {
  ...defaultBudget(properties[3]),
  price: 1500000,
  deposit: 10,
  rate: 10,
  years: 20,
};

test('research example, fixed-rate lifetime cost and percentage-point scenarios', () => {
  const loan = loanSummary(budget);
  assert.equal(loan.principal, 1350000);
  assert.ok(Math.abs(loan.payment - 13027.79) < 0.01);
  assert.ok(Math.abs(loan.totalRepaid - 3126669.19) < 1);
  assert.equal(loan.interest, loan.totalRepaid - loan.principal);
  const scenarios = rateScenarios(budget);
  assert.deepEqual(
    scenarios.map((s) => s.rate),
    [10, 11, 12],
  );
  assert.equal(scenarios[0].change, 0);
  assert.ok(Math.abs(scenarios[2].change - (bondPayment(1350000, 12, 20) - loan.payment)) < 0.01);
  assert.equal(rateScenarios({ ...budget, income: 0 })[0].incomeShare, null);
  assert.ok(
    rateScenarios({ ...budget, deposit: 100 }).every((s) => s.bond === 0 && s.change === 0),
  );
  assert.equal(loanSummary({ ...budget, rate: 0 }).interest, 0);
  assert.ok(Number.isFinite(bondPayment(1000000, 1e-12, 20)));
  for (const args of [
    [-1, 10, 20],
    [100, -1, 20],
    [100, 10, 0],
    [Infinity, 10, 20],
  ])
    assert.throws(() => bondPayment(...(args as [number, number, number])), RangeError);
});

test('upfront cash keeps unknown quotes distinct from confirmed zero and never discounts taxable value', () => {
  const partial = purchaseCosts(budget, now);
  assert.equal(partial.duty, 8700);
  assert.equal(partial.knownSubtotal, 158700);
  assert.equal(partial.complete, false);
  assert.equal(partial.missingQuotes.length, 5);
  const quoted = {
    ...budget,
    transferFees: 25000,
    bondFees: 22000,
    movingCosts: 5000,
    immediateRepairs: 0,
    otherUpfront: 0,
  };
  const complete = purchaseCosts(quoted, now);
  assert.equal(complete.knownSubtotal, 210700);
  assert.equal(complete.complete, true);
  assert.equal(purchaseCosts({ ...quoted, deposit: 100 }, now).duty, 8700);
  const exempt = purchaseCosts({ ...quoted, transferDutyExempt: true }, now);
  assert.equal(exempt.duty, null);
  assert.equal(exempt.complete, false);
  assert.equal(exempt.knownSubtotal, 202000);
  assert.equal(purchaseCosts({ ...quoted, acquisitionDate: '2026-03-31' }, now).complete, false);
});

test('saving freezes inputs, source payloads, checklist and calculated values independently', () => {
  const draft = { ...budget };
  const checked = [0, 4];
  const report = createReport(properties[3], draft, checked, now);
  assert.equal(report.budget.acquisitionDate, '2026-10-14');
  assert.equal(report.snapshot?.purchase.duty, 8700);
  assert.equal(report.snapshot?.municipality?.code, 'TSH');
  assert.equal(report.snapshot?.checklist.length, 8);
  assert.notEqual(report.snapshot?.checklist, checklist);
  draft.price = 9000000;
  checked.push(2);
  assert.equal(report.budget.price, 1500000);
  assert.deepEqual(report.checked, [0, 4]);
  assert.deepEqual(restoreReports(JSON.parse(JSON.stringify([report]))), [report]);
  const frozen = report.snapshot!;
  frozen.purchase.duty = 12345;
  frozen.monthlyTotal = 54321;
  assert.equal(reportSnapshot(report).purchase.duty, 12345);
  assert.equal(comparisonRows([report]).find((r) => r[0] === 'Monthly total')?.[1], rand(54321));
  assert.equal(comparisonRows([report]).find((r) => r[0] === 'Transfer duty')?.[1], rand(12345));
});

test('old saves are preserved and malformed financial inputs/snapshots are rejected', () => {
  const legacy = {
    property: properties[3],
    budget,
    checked: [0, 3],
    savedAt: '2026-10-13T12:00:00Z',
  };
  assert.equal(restoreReports([null, {}, legacy]).length, 1);
  assert.equal(restoreReports([{ ...legacy, budget: { price: 1 } }]).length, 0);
  assert.equal(restoreReports([{ ...legacy, snapshot: { version: 2 } }]).length, 0);
  for (const bad of [
    { deposit: 101 },
    { rate: -1 },
    { years: 0 },
    { years: 1.5 },
    { income: NaN },
    { transferFees: -1 },
  ])
    assert.equal(isBudget({ ...budget, ...bad }), false);
  assert.equal(isBudget(budget), true);
});

test('PDFs retain saved duty, evidence and calculations after source freshness expires', async () => {
  const report = createReport(properties[3], budget, [0], now);
  const snapshot = report.snapshot!;
  snapshot.monthlyTotal = 54321;
  snapshot.purchase.duty = 12345;
  snapshot.municipality!.evidence.audits[0].label = 'Frozen audit observation';
  const pdf = await buildReportDocument([report]);
  const text = pdf.output().replace(/\s/g, ' ');
  assert.ok(text.includes('R54 321'));
  assert.ok(text.includes('R12 345'));
  assert.ok(text.includes('Frozen audit observation'));
  assert.ok(text.includes('2026-10-14'));
  assert.ok(text.includes('sars.gov.za'));
  assert.ok(text.includes('[To do]'));
  const comparison = await buildReportDocument(
    [report, createReport(properties[1], budget, [], now)],
    true,
  );
  assert.ok(comparison.output().includes('YOUR HOME COMPARISON'));
  assert.ok(comparison.getNumberOfPages() > pdf.getNumberOfPages());
});
