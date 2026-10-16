import { Component, computed, input } from '@angular/core';
import { PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';
import { LineChart } from '../line-chart/line-chart';
import { buildReturnChartDatasets } from '../portfolio-chart/portfolio-chart-datasets';

/**
 * Afkast i kr.: porteføljeværdi minus alle indbetalinger til og med datoen. `entries` leverer
 * datoerne (x-aksen), `returnLine` er afkastet pr. entry (se computeReturnLine). Benchmark og
 * trendlinje er valgfrie og i samme enhed (kr. afkast), se computeReturnBenchmarkLine.
 */
@Component({
  selector: 'app-return-chart',
  imports: [LineChart],
  templateUrl: './return-chart.html',
  styleUrl: './return-chart.scss',
})
export class ReturnChart {
  readonly entries = input.required<readonly PortfolioDataPoint[]>();
  readonly returnLine = input.required<readonly number[]>();
  readonly benchmarkLine = input<readonly (number | null)[] | null>(null);
  readonly trendLine = input<readonly number[] | null>(null);

  protected readonly labels = computed(() => this.entries().map((entry) => entry.date));
  protected readonly datasets = computed(() =>
    buildReturnChartDatasets(this.returnLine(), this.benchmarkLine(), this.trendLine()),
  );
}
