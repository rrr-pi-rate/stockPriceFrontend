import { PortfolioDataPoint } from '../models/portfolio-data-point.model';
import { BenchmarkPoint } from '../models/benchmark-point.model';
import { alignBenchmarkLine, computeBenchmarkLine } from './benchmark.calculator';

describe('computeBenchmarkLine', () => {
  it('returns an empty array for an empty list', () => {
    expect(computeBenchmarkLine([], 0.1)).toEqual([]);
  });

  it('stays flat at the base value when the rate is zero', () => {
    const entries: PortfolioDataPoint[] = [
      { date: '2026-01-01', value: 1000 },
      { date: '2026-07-01', value: 1200 },
    ];
    expect(computeBenchmarkLine(entries, 0)).toEqual([1000, 1000]);
  });

  it('compounds annually from the first entry, exactly one year out', () => {
    const entries: PortfolioDataPoint[] = [
      { date: '2026-01-01', value: 1000 },
      { date: '2027-01-01', value: 9999 }, // portfolio value is irrelevant to the benchmark
    ];
    const result = computeBenchmarkLine(entries, 0.1);
    expect(result[0]).toBeCloseTo(1000, 5);
    expect(result[1]).toBeCloseTo(1100, 5);
  });
});

describe('alignBenchmarkLine', () => {
  const entries: PortfolioDataPoint[] = [
    { date: '2026-01-01', value: 1000 },
    { date: '2026-01-02', value: 1050 },
    { date: '2026-01-03', value: 1030 },
  ];

  it('returns an empty array for an empty entry list', () => {
    expect(alignBenchmarkLine([], [{ date: '2026-01-01', value: 500 }])).toEqual([]);
  });

  it('looks up the benchmark value for each entry by matching date', () => {
    const points: BenchmarkPoint[] = [
      { date: '2026-01-01', value: 500 },
      { date: '2026-01-02', value: 510 },
      { date: '2026-01-03', value: 505 },
    ];
    expect(alignBenchmarkLine(entries, points)).toEqual([500, 510, 505]);
  });

  it('fills in null for entry dates that have no matching benchmark point', () => {
    const points: BenchmarkPoint[] = [
      { date: '2026-01-01', value: 500 },
      { date: '2026-01-03', value: 505 },
    ];
    expect(alignBenchmarkLine(entries, points)).toEqual([500, null, 505]);
  });

  it('returns all nulls when the benchmark series is empty', () => {
    expect(alignBenchmarkLine(entries, [])).toEqual([null, null, null]);
  });

  it('ignores benchmark points whose dates are not present in the entries', () => {
    const points: BenchmarkPoint[] = [
      { date: '2025-12-31', value: 999 },
      { date: '2026-01-01', value: 500 },
    ];
    expect(alignBenchmarkLine(entries, points)).toEqual([500, null, null]);
  });
});
