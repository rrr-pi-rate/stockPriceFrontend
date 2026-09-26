import { PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';
import { buildChartDatasets } from './portfolio-chart-datasets';

const entries: PortfolioDataPoint[] = [
  { date: '2026-01-01', value: 1000 },
  { date: '2026-01-02', value: 1050 },
];

describe('buildChartDatasets', () => {
  it('always includes the portfolio dataset as plain values', () => {
    const [portfolio] = buildChartDatasets(entries, null, null);
    expect(portfolio.label).toBe('Portefølje');
    expect(portfolio.data).toEqual([1000, 1050]);
  });

  it('omits the benchmark and trend datasets when not provided', () => {
    const datasets = buildChartDatasets(entries, null, null);
    expect(datasets).toHaveLength(1);
  });

  it('adds a benchmark dataset when provided', () => {
    const datasets = buildChartDatasets(entries, [1000, 1100], null);
    expect(datasets).toHaveLength(2);
    expect(datasets[1]).toMatchObject({ label: 'Benchmark', data: [1000, 1100] });
  });

  it('adds a trend dataset when provided', () => {
    const datasets = buildChartDatasets(entries, null, [1010, 1040]);
    expect(datasets).toHaveLength(2);
    expect(datasets[1]).toMatchObject({ label: 'Trend', data: [1010, 1040] });
  });

  it('includes all three datasets when both overlays are provided', () => {
    const datasets = buildChartDatasets(entries, [1000, 1100], [1010, 1040]);
    expect(datasets.map((d) => d.label)).toEqual(['Portefølje', 'Benchmark', 'Trend']);
  });
});
