import { PortfolioDataPoint } from '../models/portfolio-data-point.model';
import { BenchmarkPoint } from '../models/benchmark-point.model';

/**
 * Extrapolates a hypothetical benchmark series from the portfolio's first value, compounded
 * at `annualRate`. Takes the rate as a plain number so it stays ignorant of where rates come
 * from (hardcoded table today, an external rates service tomorrow) — see BenchmarkRateProviderPort.
 */
export function computeBenchmarkLine(
  entries: readonly PortfolioDataPoint[],
  annualRate: number,
): number[] {
  if (entries.length === 0) return [];

  const base = entries[0].value;
  const startDate = new Date(entries[0].date).getTime();

  return entries.map((e) => {
    const days = (new Date(e.date).getTime() - startDate) / (1000 * 60 * 60 * 24);
    return base * Math.pow(1 + annualRate, days / 365);
  });
}

export function alignBenchmarkLine(
  entries: readonly PortfolioDataPoint[],
  points: readonly BenchmarkPoint[],
): (number | null)[] {
  const byDate = new Map(points.map((p) => [p.date, p.value]));
  return entries.map((e) => byDate.get(e.date) ?? null);
}
