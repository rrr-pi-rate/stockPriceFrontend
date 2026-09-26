import { PortfolioDataPoint } from '../models/portfolio-data-point.model';
import { Period } from '../models/period.model';

export function filterByPeriod(
  entries: readonly PortfolioDataPoint[],
  period: Period,
  referenceDate: Date = new Date(),
): PortfolioDataPoint[] {
  switch (period.kind) {
    case 'all':
      return [...entries];
    case 'ytd': {
      const ytdStart = `${referenceDate.getFullYear()}-01-01`;
      return entries.filter((e) => e.date >= ytdStart);
    }
    case 'trailing-days': {
      const cutoff = new Date(referenceDate);
      cutoff.setDate(cutoff.getDate() - period.days);
      const cutoffDate = cutoff.toISOString().slice(0, 10);
      return entries.filter((e) => e.date >= cutoffDate);
    }
  }
}
