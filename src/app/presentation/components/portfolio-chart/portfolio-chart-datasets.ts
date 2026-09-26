import { ChartDataset } from '@kirbydesign/designsystem/chart';
import { PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';

interface ChartPoint {
  readonly x: number;
  readonly y: number;
}

function toPoints(entries: readonly PortfolioDataPoint[]): ChartPoint[] {
  return entries.map((e) => ({ x: new Date(e.date).getTime(), y: e.value }));
}

function toOverlayPoints(
  entries: readonly PortfolioDataPoint[],
  values: readonly number[],
): ChartPoint[] {
  return entries.map((e, i) => ({ x: new Date(e.date).getTime(), y: values[i] }));
}

export function buildChartDatasets(
  entries: readonly PortfolioDataPoint[],
  benchmarkLine: readonly number[] | null,
  trendLine: readonly number[] | null,
): ChartDataset[] {
  const datasets: ChartDataset[] = [
    {
      label: 'Portefølje',
      data: toPoints(entries) as unknown as number[],
      borderColor: '#00a976',
      backgroundColor: 'rgba(0, 169, 118, 0.2)',
      fill: true,
    },
  ];

  if (benchmarkLine) {
    datasets.push({
      label: 'Benchmark',
      data: toOverlayPoints(entries, benchmarkLine) as unknown as number[],
      borderColor: '#c68a00',
      borderDash: [5, 4],
      fill: false,
    });
  }

  if (trendLine) {
    datasets.push({
      label: 'Trend',
      data: toOverlayPoints(entries, trendLine) as unknown as number[],
      borderColor: 'rgba(142, 26, 51, 0.7)',
      borderDash: [3, 3],
      fill: false,
    });
  }

  return datasets;
}
