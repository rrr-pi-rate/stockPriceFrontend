import { Component, computed, input } from '@angular/core';
import { PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';
import { LineChart } from '../line-chart/line-chart';
import { buildReturnChartDatasets } from '../portfolio-chart/portfolio-chart-datasets';

/**
 * Afkast i %: gevinsten siden periodens start (værdi minus indbetalinger) i forhold til den
 * tidsvægtede kapital, se computeReturnPercentLine. `entries` leverer datoerne (x-aksen),
 * `returnPercentLine` er afkastet pr. entry. Benchmark og trendlinje er valgfrie og i samme
 * enhed (%), se computeReturnBenchmarkPercentLine.
 */
@Component({
  selector: 'app-return-chart',
  imports: [LineChart],
  templateUrl: './return-chart.html',
  styleUrl: './return-chart.scss',
})
export class ReturnChart {
  readonly entries = input.required<readonly PortfolioDataPoint[]>();
  readonly returnPercentLine = input.required<readonly number[]>();
  readonly benchmarkLine = input<readonly (number | null)[] | null>(null);
  readonly trendLine = input<readonly number[] | null>(null);

  protected readonly labels = computed(() => this.entries().map((entry) => entry.date));
  protected readonly datasets = computed(() =>
    buildReturnChartDatasets(this.returnPercentLine(), this.benchmarkLine(), this.trendLine()),
  );
}
