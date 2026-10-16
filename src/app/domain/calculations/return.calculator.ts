import { Deposit } from '../models/deposit.model';
import { PortfolioDataPoint } from '../models/portfolio-data-point.model';

/**
 * Return (afkast) in DKK for each entry: portfolio value minus everything deposited up to and
 * including that date. Deposits are summed over the full history, not just the visible period,
 * so a period view shows the true accumulated return rather than restarting at zero.
 */
export function computeReturnLine(
  entries: readonly PortfolioDataPoint[],
  deposits: readonly Deposit[],
): number[] {
  const sorted = [...deposits].sort((a, b) => a.date.localeCompare(b.date));
  let next = 0;
  let deposited = 0;

  return entries.map((entry) => {
    while (next < sorted.length && sorted[next].date <= entry.date) {
      deposited += sorted[next].amount;
      next++;
    }
    return entry.value - deposited;
  });
}

/**
 * Return line for "what if the same money had gone into the benchmark": level with the
 * portfolio's return at the first benchmark point, after which the capital grows with the
 * benchmark and every later deposit is added, all measured against the same total deposited.
 * `benchmarkLine` is the value-rebased line from the portfolio chart - only its growth from
 * point to point is used. Null before the first benchmark point; a gap carries the last value.
 */
export function computeReturnBenchmarkLine(
  entries: readonly PortfolioDataPoint[],
  returnLine: readonly number[],
  benchmarkLine: readonly (number | null)[],
): (number | null)[] {
  const anchor = benchmarkLine.findIndex((value) => value != null);
  const result: (number | null)[] = entries.map(() => null);
  if (anchor === -1) return result;

  let lastBenchmark = benchmarkLine[anchor] as number;
  let benchmarkCapital = entries[anchor].value;
  let invested = entries[anchor].value;
  result[anchor] = returnLine[anchor];

  for (let i = anchor + 1; i < entries.length; i++) {
    const deposit =
      entries[i].value - returnLine[i] - (entries[i - 1].value - returnLine[i - 1]);
    const benchmark = benchmarkLine[i] ?? lastBenchmark;

    benchmarkCapital = benchmarkCapital * (benchmark / lastBenchmark) + deposit;
    invested += deposit;
    lastBenchmark = benchmark;
    result[i] = returnLine[anchor] + (benchmarkCapital - invested);
  }

  return result;
}

/**
 * Real return over `entries` (one period): the gain not explained by deposits, in DKK and %.
 * Amount = return at the end minus return at the start (see computeReturnLine). Percentage uses
 * Modified Dietz: gain divided by the start value plus each in-period deposit weighted by how
 * long it was invested, so a deposit made late in the period counts for less than an early one.
 * Deposits dated on the first entry are already part of its start value. Null with fewer than
 * two entries, or when there is no capital to relate the gain to.
 */
export function computePeriodReturn(
  entries: readonly PortfolioDataPoint[],
  deposits: readonly Deposit[],
): { readonly absolute: number; readonly percentage: number } | null {
  if (entries.length < 2) return null;

  const first = entries[0];
  const last = entries[entries.length - 1];
  const line = computeReturnLine([first, last], deposits);
  const absolute = line[1] - line[0];

  const endTime = Date.parse(last.date);
  const totalTime = endTime - Date.parse(first.date);
  const weightedDeposits = deposits
    .filter((deposit) => deposit.date > first.date && deposit.date <= last.date)
    .reduce(
      (sum, deposit) => sum + deposit.amount * ((endTime - Date.parse(deposit.date)) / totalTime),
      0,
    );

  const capital = first.value + weightedDeposits;
  return capital > 0 ? { absolute, percentage: (absolute / capital) * 100 } : null;
}
