import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bondPayment, budgetLines, defaultBudget, monthlyTotal } from './budget';
import { properties, distanceKm } from './data';

test('bond amortisation matches a known 20-year repayment and handles zero interest', () => {
  assert.ok(Math.abs(bondPayment(1000000, 10, 20) - 9650.22) < 0.01);
  assert.equal(bondPayment(120000, 0, 10), 1000);
  assert.equal(bondPayment(0, 10, 20), 0);
});
test('ownership costs include the return commute and reflect a full deposit', () => {
  const b = { ...defaultBudget(properties[0]), deposit: 100 };
  assert.equal(budgetLines(b)[0].value, 0);
  assert.equal(budgetLines(b)[6].value, 6.5 * 2 * 22 * 3.8);
  assert.equal(
    monthlyTotal(b),
    b.rates + b.levy + b.utilities + b.insurance + b.maintenance + 6.5 * 2 * 22 * 3.8,
  );
});
test('map distances use coordinates, not invented walking times', () => {
  assert.equal(distanceKm(-33.9, 18.4, -33.9, 18.4), 0);
  assert.ok(distanceKm(-33.9, 18.4, -33.91, 18.4) > 1.1);
});
