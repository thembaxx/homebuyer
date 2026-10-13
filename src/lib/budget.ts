import type { Property } from './data';

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
};
export type SavedReport = {
  property: Property;
  budget: Budget;
  savedAt: string;
  checked: number[];
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
  if (principal <= 0) return 0;
  const months = Math.max(1, years * 12);
  const monthlyRate = annualRate / 1200;
  return monthlyRate === 0
    ? principal / months
    : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
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
