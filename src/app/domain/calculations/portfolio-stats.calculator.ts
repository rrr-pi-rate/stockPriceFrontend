import { PortfolioDataPoint } from '../models/portfolio-data-point.model';
import { ValueChange } from '../models/value-change.model';

export interface BestDay {
  readonly date: string;
  readonly change: number;
}

function computeValueChange(from: number, to: number): ValueChange {
  const absolute = to - from;
  return { absolute, percentage: (absolute / from) * 100 };
}

export function latestDataPoint(entries: readonly PortfolioDataPoint[]): PortfolioDataPoint | null {
  return entries.length > 0 ? entries[entries.length - 1] : null;
}

export function dayOverDayChange(entries: readonly PortfolioDataPoint[]): ValueChange | null {
  if (entries.length < 2) return null;
  const latest = entries[entries.length - 1];
  const previous = entries[entries.length - 2];
  return computeValueChange(previous.value, latest.value);
}

export function yearToDateChange(
  entries: readonly PortfolioDataPoint[],
  referenceDate: Date = new Date(),
): ValueChange | null {
  const latest = latestDataPoint(entries);
  if (!latest) return null;
  const ytdStart = `${referenceDate.getFullYear()}-01-01`;
  const firstOfYear = entries.find((e) => e.date >= ytdStart);
  return firstOfYear ? computeValueChange(firstOfYear.value, latest.value) : null;
}

export function dateRange(
  entries: readonly PortfolioDataPoint[],
): { readonly from: string; readonly to: string } | null {
  if (entries.length === 0) return null;
  return { from: entries[0].date, to: entries[entries.length - 1].date };
}

export function periodChange(entries: readonly PortfolioDataPoint[]): ValueChange | null {
  if (entries.length === 0) return null;
  return computeValueChange(entries[0].value, entries[entries.length - 1].value);
}

export function bestDay(entries: readonly PortfolioDataPoint[]): BestDay | null {
  if (entries.length < 2) return null;
  let best: BestDay | null = null;
  for (let i = 1; i < entries.length; i++) {
    const change = entries[i].value - entries[i - 1].value;
    if (best === null || change > best.change) {
      best = { date: entries[i].date, change };
    }
  }
  return best;
}

/** Population standard deviation of day-over-day changes; needs at least 3 points (2 deltas) to be meaningful, matching kirby.html. */
export function volatility(entries: readonly PortfolioDataPoint[]): number | null {
  if (entries.length < 3) return null;
  const dailyChanges: number[] = [];
  for (let i = 1; i < entries.length; i++) {
    dailyChanges.push(entries[i].value - entries[i - 1].value);
  }
  const mean = dailyChanges.reduce((a, b) => a + b, 0) / dailyChanges.length;
  const variance = dailyChanges.reduce((sum, v) => sum + (v - mean) ** 2, 0) / dailyChanges.length;
  return Math.sqrt(variance);
}
