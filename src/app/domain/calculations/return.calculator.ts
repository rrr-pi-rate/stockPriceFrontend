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
 * Modified Dietz denominator: the capital at work between two dates - the start value plus each
 * deposit made after `startDate` (up to `endDate`), weighted by the share of the span it was
 * invested, so a late deposit counts for less than an early one. A deposit dated on `startDate`
 * is already part of the start value.
 */
function dietzCapital(
  startValue: number,
  startDate: string,
  endDate: string,
  deposits: readonly Deposit[],
): number {
  const endTime = Date.parse(endDate);
  const totalTime = endTime - Date.parse(startDate);
  const weightedDeposits = deposits
    .filter((deposit) => deposit.date > startDate && deposit.date <= endDate)
    .reduce(
      (sum, deposit) => sum + deposit.amount * ((endTime - Date.parse(deposit.date)) / totalTime),
      0,
    );
  return startValue + weightedDeposits;
}

/**
 * Return in % for each entry, measured from the first entry: the gain since then (value minus
 * deposits, see computeReturnLine) over the Modified Dietz capital at that point. Starts at 0 and
 * its last point equals computePeriodReturn().percentage. Null when there is no capital to
 * relate the gain to (a zero start value).
 */
export function computeReturnPercentLine(
  entries: readonly PortfolioDataPoint[],
  deposits: readonly Deposit[],
): number[] | null {
  if (entries.length === 0) return null;

  const returnLine = computeReturnLine(entries, deposits);
  const first = entries[0];
  const result: number[] = [];

  for (let i = 0; i < entries.length; i++) {
    const capital = dietzCapital(first.value, first.date, entries[i].date, deposits);
    if (capital <= 0) return null;
    result.push(((returnLine[i] - returnLine[0]) / capital) * 100);
  }
  return result;
}

/**
 * The same %-return as computeReturnPercentLine, for "what if the same money had gone into the
 * benchmark": the capital at the first benchmark point grows with the benchmark and every later
 * deposit is added at that day's benchmark level. Gain over the same Dietz capital, so it is
 * directly comparable with the portfolio line. `benchmarkLine` is the value-rebased line from the
 * portfolio chart - only its growth from point to point is used. Null before the first benchmark
 * point (where the line starts at 0); a gap carries the last benchmark value.
 */
export function computeReturnBenchmarkPercentLine(
  entries: readonly PortfolioDataPoint[],
  deposits: readonly Deposit[],
  benchmarkLine: readonly (number | null)[],
): (number | null)[] {
  const anchor = benchmarkLine.findIndex((value) => value != null);
  const result: (number | null)[] = entries.map(() => null);
  if (anchor === -1) return result;

  const returnLine = computeReturnLine(entries, deposits);
  const start = entries[anchor];
  let lastBenchmark = benchmarkLine[anchor] as number;
  let benchmarkCapital = start.value;
  let invested = start.value;
  result[anchor] = 0;

  for (let i = anchor + 1; i < entries.length; i++) {
    // What was deposited at this entry (incl. deposits from days without a value point).
    const deposit =
      entries[i].value - returnLine[i] - (entries[i - 1].value - returnLine[i - 1]);
    const benchmark = benchmarkLine[i] ?? lastBenchmark;

    benchmarkCapital = benchmarkCapital * (benchmark / lastBenchmark) + deposit;
    invested += deposit;
    lastBenchmark = benchmark;

    const capital = dietzCapital(start.value, start.date, entries[i].date, deposits);
    result[i] = capital > 0 ? ((benchmarkCapital - invested) / capital) * 100 : null;
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

  const capital = dietzCapital(first.value, first.date, last.date, deposits);
  return capital > 0 ? { absolute, percentage: (absolute / capital) * 100 } : null;
}
