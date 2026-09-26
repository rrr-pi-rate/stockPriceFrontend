import { StatCardTone } from '../components/stat-card/stat-card';

const currencyFormatter = new Intl.NumberFormat('da-DK', {
  style: 'currency',
  currency: 'DKK',
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)} %`;
}

export function toneFor(value: number): StatCardTone {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
}
