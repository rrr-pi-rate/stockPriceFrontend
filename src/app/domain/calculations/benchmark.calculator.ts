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

/**
 * Rebases the (already DKK-converted) benchmark series to the portfolio's own starting value,
 * so the chart shows relative performance ("what would my start value have become at the
 * benchmark's growth rate") instead of the benchmark's unrelated absolute price level - matching
 * how computeBenchmarkLine presents the synthetic-rate benchmarks. Anchors on the first entry
 * date that actually has a benchmark point, not always entries[0], since portfolio and benchmark
 * dates don't align 1:1 (see BenchmarkPoint date-alignment caveat in TODO_REAL_BENCHMARK.md).
 */
export function alignBenchmarkLine(
  entries: readonly PortfolioDataPoint[],
  points: readonly BenchmarkPoint[],
): (number | null)[] {
  const byDate = new Map(points.map((p) => [p.date, p.value]));
  const anchorIndex = entries.findIndex((e) => byDate.has(e.date));
  if (anchorIndex === -1) return entries.map(() => null);

  const anchorPortfolioValue = entries[anchorIndex].value;
  const anchorBenchmarkValue = byDate.get(entries[anchorIndex].date)!;

  return entries.map((e) => {
    const raw = byDate.get(e.date);
    return raw == null ? null : anchorPortfolioValue * (raw / anchorBenchmarkValue);
  });
}
