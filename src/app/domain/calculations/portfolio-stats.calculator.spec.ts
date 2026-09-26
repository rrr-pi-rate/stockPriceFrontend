import { PortfolioDataPoint } from '../models/portfolio-data-point.model';
import {
  bestDay,
  dateRange,
  dayOverDayChange,
  latestDataPoint,
  periodChange,
  volatility,
  yearToDateChange,
} from './portfolio-stats.calculator';

const entries: PortfolioDataPoint[] = [
  { date: '2026-01-01', value: 1000 },
  { date: '2026-01-02', value: 1050 },
  { date: '2026-01-03', value: 1030 },
  { date: '2026-01-04', value: 1100 },
  { date: '2026-01-05', value: 1080 },
];

const referenceDate = new Date('2026-09-26T00:00:00Z');

describe('latestDataPoint', () => {
  it('returns null for an empty list', () => {
    expect(latestDataPoint([])).toBeNull();
  });

  it('returns the last entry', () => {
    expect(latestDataPoint(entries)).toEqual({ date: '2026-01-05', value: 1080 });
  });
});

describe('dayOverDayChange', () => {
  it('returns null with fewer than 2 entries', () => {
    expect(dayOverDayChange([entries[0]])).toBeNull();
  });

  it('compares the last two entries', () => {
    const result = dayOverDayChange(entries);
    expect(result?.absolute).toBe(-20);
    expect(result?.percentage).toBeCloseTo((-20 / 1100) * 100, 5);
  });
});

describe('yearToDateChange', () => {
  it('returns null for an empty list', () => {
    expect(yearToDateChange([], referenceDate)).toBeNull();
  });

  it('returns null when no entry falls within the reference year', () => {
    const priorYear: PortfolioDataPoint[] = [{ date: '2025-06-01', value: 500 }];
    expect(yearToDateChange(priorYear, referenceDate)).toBeNull();
  });

  it('compares the first entry of the reference year against the latest', () => {
    const result = yearToDateChange(entries, referenceDate);
    expect(result?.absolute).toBe(80);
    expect(result?.percentage).toBeCloseTo(8, 5);
  });
});

describe('dateRange', () => {
  it('returns null for an empty list', () => {
    expect(dateRange([])).toBeNull();
  });

  it('returns the first and last date', () => {
    expect(dateRange(entries)).toEqual({ from: '2026-01-01', to: '2026-01-05' });
  });
});

describe('periodChange', () => {
  it('returns null for an empty list', () => {
    expect(periodChange([])).toBeNull();
  });

  it('is zero for a single entry', () => {
    expect(periodChange([entries[0]])).toEqual({ absolute: 0, percentage: 0 });
  });

  it('compares the first and last entry of the period', () => {
    const result = periodChange(entries);
    expect(result?.absolute).toBe(80);
    expect(result?.percentage).toBeCloseTo(8, 5);
  });
});

describe('bestDay', () => {
  it('returns null with fewer than 2 entries', () => {
    expect(bestDay([entries[0]])).toBeNull();
  });

  it('finds the day with the largest day-over-day increase', () => {
    expect(bestDay(entries)).toEqual({ date: '2026-01-04', change: 70 });
  });
});

describe('volatility', () => {
  it('returns null with fewer than 3 entries', () => {
    expect(volatility(entries.slice(0, 2))).toBeNull();
  });

  it('computes the population standard deviation of day-over-day changes', () => {
    expect(volatility(entries)).toBeCloseTo(Math.sqrt(1650), 5);
  });
});
