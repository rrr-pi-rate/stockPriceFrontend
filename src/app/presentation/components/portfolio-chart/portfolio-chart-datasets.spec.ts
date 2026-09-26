import { PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';
import { buildChartDatasets } from './portfolio-chart-datasets';

const entries: PortfolioDataPoint[] = [
  { date: '2026-01-01', value: 1000 },
  { date: '2026-01-02', value: 1050 },
];

describe('buildChartDatasets', () => {
  it('always includes the portfolio dataset as {x,y} points keyed by timestamp', () => {
    const [portfolio] = buildChartDatasets(entries, null, null);
    expect(portfolio.label).toBe('Portefølje');
    expect(portfolio.data).toEqual([
      { x: new Date('2026-01-01').getTime(), y: 1000 },
      { x: new Date('2026-01-02').getTime(), y: 1050 },
    ]);
  });

  it('omits the benchmark and trend datasets when not provided', () => {
    const datasets = buildChartDatasets(entries, null, null);
    expect(datasets).toHaveLength(1);
  });

  it('adds a benchmark dataset aligned with the same timestamps when provided', () => {
    const datasets = buildChartDatasets(entries, [1000, 1100], null);
    expect(datasets).toHaveLength(2);
    expect(datasets[1]).toMatchObject({ label: 'Benchmark' });
    expect(datasets[1].data).toEqual([
      { x: new Date('2026-01-01').getTime(), y: 1000 },
      { x: new Date('2026-01-02').getTime(), y: 1100 },
    ]);
  });

  it('adds a trend dataset when provided', () => {
    const datasets = buildChartDatasets(entries, null, [1010, 1040]);
    expect(datasets).toHaveLength(2);
    expect(datasets[1]).toMatchObject({ label: 'Trend' });
  });

  it('includes all three datasets when both overlays are provided', () => {
    const datasets = buildChartDatasets(entries, [1000, 1100], [1010, 1040]);
    expect(datasets.map((d) => d.label)).toEqual(['Portefølje', 'Benchmark', 'Trend']);
  });
});
