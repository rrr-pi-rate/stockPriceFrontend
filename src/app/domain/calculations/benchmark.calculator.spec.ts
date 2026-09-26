import { PortfolioDataPoint } from '../models/portfolio-data-point.model';
import { computeBenchmarkLine } from './benchmark.calculator';

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
