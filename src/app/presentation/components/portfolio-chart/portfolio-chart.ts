import { Component, computed, input } from '@angular/core';
import { StockChartComponent } from '@kirbydesign/designsystem/chart';
import { PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';
import { buildChartDatasets } from './portfolio-chart-datasets';

@Component({
  selector: 'app-portfolio-chart',
  imports: [StockChartComponent],
  templateUrl: './portfolio-chart.html',
})
export class PortfolioChart {
  readonly entries = input.required<readonly PortfolioDataPoint[]>();
  readonly benchmarkLine = input<readonly number[] | null>(null);
  readonly trendLine = input<readonly number[] | null>(null);

  protected readonly datasets = computed(() =>
    buildChartDatasets(this.entries(), this.benchmarkLine(), this.trendLine()),
  );

  protected readonly labels = computed(() => this.entries().map((entry) => entry.date));
}
