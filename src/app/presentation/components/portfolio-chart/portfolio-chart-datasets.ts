import { PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';

export interface LineChartDataset {
  readonly label: string;
  readonly data: readonly number[];
  readonly borderColor: string;
  readonly backgroundColor: string;
  readonly borderWidth: number;
  readonly borderDash?: readonly number[];
  readonly pointRadius: number;
  readonly pointHoverRadius: number;
  readonly fill: boolean;
  readonly tension: number;
  readonly order: number;
}

export function buildChartDatasets(
  entries: readonly PortfolioDataPoint[],
  benchmarkLine: readonly number[] | null,
  trendLine: readonly number[] | null,
): LineChartDataset[] {
  const datasets: LineChartDataset[] = [
    {
      label: 'Portefølje',
      data: entries.map((entry) => entry.value),
      borderColor: '#00a976',
      backgroundColor: 'rgba(0, 169, 118, 0.2)',
      borderWidth: 2,
      pointRadius: entries.length > 100 ? 0 : 3,
      pointHoverRadius: 5,
      fill: true,
      tension: 0.3,
      order: 1,
    },
  ];

  if (benchmarkLine) {
    datasets.push({
      label: 'Benchmark',
      data: benchmarkLine,
      borderColor: '#c68a00',
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderDash: [5, 4],
      pointRadius: 0,
      pointHoverRadius: 4,
      fill: false,
      tension: 0.3,
      order: 2,
    });
  }

  if (trendLine) {
    datasets.push({
      label: 'Trend',
      data: trendLine,
      borderColor: 'rgba(142, 26, 51, 0.7)',
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderDash: [3, 3],
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: false,
      tension: 0,
      order: 3,
    });
  }

  return datasets;
}
