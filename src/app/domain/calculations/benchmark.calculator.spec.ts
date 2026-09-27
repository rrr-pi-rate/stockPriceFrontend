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

  it('rebases the benchmark to the portfolio value on the first matching date', () => {
    const points: BenchmarkPoint[] = [
      { date: '2026-01-01', value: 500 },
      { date: '2026-01-02', value: 510 },
      { date: '2026-01-03', value: 505 },
    ];
    // Benchmark grows +2% then -1% from its anchor value (500); applied to the
    // portfolio's own anchor value (1000) instead of shown as raw DKK prices.
    expect(alignBenchmarkLine(entries, points)).toEqual([1000, 1020, 1010]);
  });

  it('fills in null for entry dates that have no matching benchmark point', () => {
    const points: BenchmarkPoint[] = [
      { date: '2026-01-01', value: 500 },
      { date: '2026-01-03', value: 505 },
    ];
    expect(alignBenchmarkLine(entries, points)).toEqual([1000, null, 1010]);
  });

  it('returns all nulls when the benchmark series is empty', () => {
    expect(alignBenchmarkLine(entries, [])).toEqual([null, null, null]);
  });

  it('ignores benchmark points whose dates are not present in the entries', () => {
    const points: BenchmarkPoint[] = [
      { date: '2025-12-31', value: 999 },
      { date: '2026-01-01', value: 500 },
    ];
    expect(alignBenchmarkLine(entries, points)).toEqual([1000, null, null]);
  });

  it('anchors on the first entry date that has a benchmark point, not always entries[0]', () => {
    const points: BenchmarkPoint[] = [
      { date: '2026-01-02', value: 200 },
      { date: '2026-01-03', value: 220 },
    ];
    // No benchmark point for 01-01, so the anchor is 01-02: portfolio value 1050 there
    // stands in for the benchmark's 200, and 01-03's +10% growth applies to that 1050.
    expect(alignBenchmarkLine(entries, points)).toEqual([null, 1050, 1155]);
  });

  it('scales a non-trivial anchor value by the benchmark growth ratio', () => {
    const bigEntries: PortfolioDataPoint[] = [
      { date: '2026-01-01', value: 2000 },
      { date: '2026-01-02', value: 2100 },
    ];
    const points: BenchmarkPoint[] = [
      { date: '2026-01-01', value: 500 },
      { date: '2026-01-02', value: 600 },
    ];
    expect(alignBenchmarkLine(bigEntries, points)).toEqual([2000, 2400]);
  });
});
