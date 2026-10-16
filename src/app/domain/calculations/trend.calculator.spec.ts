import { PortfolioDataPoint } from '../models/portfolio-data-point.model';
import { computeTrendLine } from './trend.calculator';

function points(values: number[]): PortfolioDataPoint[] {
  return values.map((value, i) => ({ date: `2026-01-0${i + 1}`, value }));
}

describe('computeTrendLine', () => {
  it('returns an empty array with fewer than 2 entries', () => {
    expect(computeTrendLine([])).toEqual([]);
    expect(computeTrendLine(points([1000]))).toEqual([]);
  });

  it('reproduces a perfectly linear series exactly', () => {
    expect(computeTrendLine(points([10, 12, 14, 16]))).toEqual([10, 12, 14, 16]);
  });

  it('fits a least-squares line through noisy data, rounded to whole units', () => {
    const result = computeTrendLine(points([1000, 1050, 1030, 1100, 1080]));
    expect(result).toEqual([1010, 1031, 1052, 1073, 1094]);
  });

  it('keeps the requested number of decimals, so small values such as percentages survive', () => {
    // slope 0.52, intercept 0.52
    const values = points([0.5, 1.0, 1.7, 2.0]);
    expect(computeTrendLine(values, 2)).toEqual([0.52, 1.04, 1.56, 2.08]);
    expect(computeTrendLine(values)).toEqual([1, 1, 2, 2]);
  });
});
