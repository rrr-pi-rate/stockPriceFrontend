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

/** Short percentage for chart axes, e.g. "-2,5 %" (at most one decimal, no forced plus sign). */
export function formatAxisPercentage(value: number): string {
  return value.toLocaleString('da-DK', { maximumFractionDigits: 1 }) + ' %';
}

export function formatCompactNumber(value: number): string {
  if (Math.abs(value) >= 1e6) {
    return (value / 1e6).toLocaleString('da-DK', { maximumFractionDigits: 1 }) + 'M';
  }
  if (Math.abs(value) >= 1e3) {
    return (value / 1e3).toLocaleString('da-DK', { maximumFractionDigits: 0 }) + 'k';
  }
  return value.toString();
}

export function toneFor(value: number): StatCardTone {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
}
