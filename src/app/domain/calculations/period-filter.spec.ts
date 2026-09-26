import { PortfolioDataPoint } from '../models/portfolio-data-point.model';
import { filterByPeriod } from './period-filter';

const entries: PortfolioDataPoint[] = [
  { date: '2025-01-01', value: 100 },
  { date: '2025-06-15', value: 110 },
  { date: '2025-12-01', value: 120 },
  { date: '2026-01-01', value: 130 },
  { date: '2026-09-20', value: 140 },
];

const referenceDate = new Date('2026-09-26T00:00:00Z');

describe('filterByPeriod', () => {
  it('returns every entry for "all"', () => {
    expect(filterByPeriod(entries, { kind: 'all' }, referenceDate)).toEqual(entries);
  });

  it('keeps only entries from the start of the reference year for "ytd"', () => {
    const result = filterByPeriod(entries, { kind: 'ytd' }, referenceDate);
    expect(result.map((e) => e.date)).toEqual(['2026-01-01', '2026-09-20']);
  });

  it('keeps only entries within the trailing window for "trailing-days"', () => {
    const result = filterByPeriod(entries, { kind: 'trailing-days', days: 30 }, referenceDate);
    expect(result.map((e) => e.date)).toEqual(['2026-09-20']);
  });

  it('returns an empty array when nothing falls in the window', () => {
    const result = filterByPeriod(entries, { kind: 'trailing-days', days: 1 }, referenceDate);
    expect(result).toEqual([]);
  });
});
