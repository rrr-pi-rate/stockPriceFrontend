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
