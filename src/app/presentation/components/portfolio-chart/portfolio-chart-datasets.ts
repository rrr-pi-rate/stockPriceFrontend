import { PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';
import { LineChartDataset } from '../line-chart/line-chart';

/**
 * Always returns all three datasets (Portefølje, Benchmark, Trend), with an
 * empty `data` array for a disabled overlay rather than omitting it. Kept
 * stable so the chart can mutate `.data` on the same dataset objects across
 * updates instead of replacing them - that's what lets Chart.js morph
 * smoothly between periods instead of popping in a "new" dataset.
 */
export function buildChartDatasets(
  entries: readonly PortfolioDataPoint[],
  benchmarkLine: readonly (number | null)[] | null,
  trendLine: readonly number[] | null,
): LineChartDataset[] {
  return [
    {
      label: 'Portefølje',
      data: entries.map((entry) => entry.value),
      borderColor: '#00a976',
      backgroundColor: 'rgba(0, 169, 118, 0.2)',
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 5,
      fill: true,
      tension: 0.3,
      order: 1,
    },
    benchmarkDataset(benchmarkLine),
    trendDataset(trendLine),
  ];
}

/** Same stable-three-datasets contract as buildChartDatasets, for the return chart. */
export function buildReturnChartDatasets(
  returnLine: readonly number[],
  benchmarkLine: readonly (number | null)[] | null,
  trendLine: readonly number[] | null,
): LineChartDataset[] {
  return [
    {
      label: 'Afkast',
      data: [...returnLine],
      borderColor: '#00a976',
      backgroundColor: 'rgba(0, 169, 118, 0.2)',
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 5,
      fill: 'origin',
      tension: 0.3,
      order: 1,
    },
    benchmarkDataset(benchmarkLine),
    trendDataset(trendLine),
  ];
}

function benchmarkDataset(benchmarkLine: readonly (number | null)[] | null): LineChartDataset {
  return {
    label: 'Benchmark',
    data: benchmarkLine ? [...benchmarkLine] : [],
    borderColor: '#c68a00',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderDash: [5, 4],
    pointRadius: 0,
    pointHoverRadius: 4,
    fill: false,
    tension: 0.3,
    order: 2,
    spanGaps: true,
  };
}

function trendDataset(trendLine: readonly number[] | null): LineChartDataset {
  return {
    label: 'Trend',
    data: trendLine ? [...trendLine] : [],
    borderColor: 'rgba(142, 26, 51, 0.7)',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderDash: [3, 3],
    pointRadius: 0,
    pointHoverRadius: 0,
    fill: false,
    tension: 0,
    order: 3,
  };
}
