import { PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';
import { buildChartDatasets } from './portfolio-chart-datasets';

const entries: PortfolioDataPoint[] = [
  { date: '2026-01-01', value: 1000 },
  { date: '2026-01-02', value: 1050 },
];

describe('buildChartDatasets', () => {
  it('always returns all three datasets in a stable order', () => {
    const datasets = buildChartDatasets(entries, null, null);
    expect(datasets.map((d) => d.label)).toEqual(['Portefølje', 'Benchmark', 'Trend']);
  });

  it('includes the portfolio dataset as plain values', () => {
    const [portfolio] = buildChartDatasets(entries, null, null);
    expect(portfolio.data).toEqual([1000, 1050]);
  });

  it('gives benchmark and trend an empty data array when not provided', () => {
    const [, benchmark, trend] = buildChartDatasets(entries, null, null);
    expect(benchmark.data).toEqual([]);
    expect(trend.data).toEqual([]);
  });

  it('fills the benchmark dataset when provided', () => {
    const [, benchmark] = buildChartDatasets(entries, [1000, 1100], null);
    expect(benchmark.data).toEqual([1000, 1100]);
  });

  it('fills the trend dataset when provided', () => {
    const [, , trend] = buildChartDatasets(entries, null, [1010, 1040]);
    expect(trend.data).toEqual([1010, 1040]);
  });
});
