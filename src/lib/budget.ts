import type { Property } from './data';
import type { ReportSnapshot } from './reports';

export type Budget = {
  price: number;
  deposit: number;
  rate: number;
  years: number;
  rates: number;
  levy: number;
  utilities: number;
  insurance: number;
  maintenance: number;
  commuteKm: number;
  workdays: number;
  costPerKm: number;
  destination: string;
  income: number;
  acquisitionDate?: string;
  transferDutyExempt?: boolean;
  transferFees?: number;
  bondFees?: number;
  movingCosts?: number;
  immediateRepairs?: number;
  otherUpfront?: number;
};
export type SavedReport = {
  property: Property;
  budget: Budget;
  savedAt: string;
  checked: number[];
  snapshot?: ReportSnapshot;
};
export const rand = (value: number) =>
  `R${Math.round(value).toLocaleString('en-ZA').replace(/,/g, ' ')}`;
export function defaultBudget(p: Property): Budget {
  return {
    price: p.price,
    deposit: 10,
    rate: 10.75,
    years: 20,
    rates: p.rates,
    levy: p.levy,
    utilities: p.utilities,
    insurance: 650,
    maintenance: Math.round((p.price * 0.01) / 12),
    commuteKm:
      p.city === 'Johannesburg' ? 14 : p.city === 'Durban' ? 18 : p.city === 'Pretoria' ? 9 : 6.5,
    workdays: 22,
    costPerKm: 3.8,
    destination:
      p.city === 'Cape Town'
        ? 'Cape Town CBD'
        : p.city === 'Johannesburg'
          ? 'Sandton CBD'
          : p.city === 'Durban'
            ? 'Durban CBD'
            : p.city === 'Pretoria'
              ? 'Pretoria CBD'
              : '',
    income: 65000,
  };
}
export function bondPayment(principal: number, annualRate: number, years: number) {
  if (
    ![principal, annualRate, years].every(Number.isFinite) ||
    principal < 0 ||
    annualRate < 0 ||
    years <= 0
  )
    throw new RangeError('Bond inputs must be finite, non-negative, with a positive term');
  if (principal <= 0) return 0;
  const months = years * 12;
  const monthlyRate = annualRate / 1200;
  return monthlyRate === 0
    ? principal / months
    : (principal * monthlyRate) / -Math.expm1(-months * Math.log1p(monthlyRate));
}
export function budgetLines(b: Budget) {
  return [
    {
      label: 'Bond repayment',
      value: bondPayment(b.price * (1 - b.deposit / 100), b.rate, b.years),
      color: '#353c31',
    },
    { label: 'Rates & taxes', value: b.rates, color: '#9fae83' },
    { label: 'Levies', value: b.levy, color: '#b8bfad' },
    { label: 'Utilities', value: b.utilities, color: '#c7b99e' },
    { label: 'Home insurance', value: b.insurance, color: '#d1cfc2' },
    { label: 'Maintenance reserve', value: b.maintenance, color: '#dfeb9c' },
    {
      label: 'Commute allowance',
      value: b.commuteKm * 2 * b.workdays * b.costPerKm,
      color: '#e4b792',
    },
  ];
}
export function monthlyTotal(b: Budget) {
  return budgetLines(b).reduce((sum, line) => sum + line.value, 0);
}

export function loanSummary(b: Budget) {
  const principal = b.price * (1 - b.deposit / 100);
  const payment = bondPayment(principal, b.rate, b.years);
  const totalRepaid = payment * b.years * 12;
  return { principal, payment, totalRepaid, interest: Math.max(0, totalRepaid - principal) };
}

export function rateScenarios(b: Budget) {
  const currentTotal = monthlyTotal(b);
  return [0, 1, 2].map((increase) => {
    const scenario = { ...b, rate: b.rate + increase };
    const bond = loanSummary(scenario).payment;
    const total = monthlyTotal(scenario);
    return {
      increase,
      rate: scenario.rate,
      bond,
      total,
      change: total - currentTotal,
      incomeShare: b.income > 0 ? (total / b.income) * 100 : null,
    };
  });
}
