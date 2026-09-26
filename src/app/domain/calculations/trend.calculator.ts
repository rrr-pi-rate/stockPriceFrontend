import { PortfolioDataPoint } from '../models/portfolio-data-point.model';

/** Least-squares linear regression over the entry index, rounded to whole units to match the chart's original resolution. */
export function computeTrendLine(entries: readonly PortfolioDataPoint[]): number[] {
  const n = entries.length;
  if (n < 2) return [];

  const meanX = (n - 1) / 2;
  const meanY = entries.reduce((sum, e) => sum + e.value, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let x = 0; x < n; x++) {
    const dx = x - meanX;
    numerator += dx * (entries[x].value - meanY);
    denominator += dx * dx;
  }

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;

  return Array.from({ length: n }, (_, x) => Math.round(slope * x + intercept));
}
