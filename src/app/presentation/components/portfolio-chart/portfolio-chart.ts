import { Component, computed, input } from '@angular/core';
import { PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';
import { LineChart } from '../line-chart/line-chart';
import { buildChartDatasets } from './portfolio-chart-datasets';

@Component({
  selector: 'app-portfolio-chart',
  imports: [LineChart],
  templateUrl: './portfolio-chart.html',
  styleUrl: './portfolio-chart.scss',
})
export class PortfolioChart {
  readonly entries = input.required<readonly PortfolioDataPoint[]>();
  readonly benchmarkLine = input<readonly (number | null)[] | null>(null);
  readonly trendLine = input<readonly number[] | null>(null);

  protected readonly labels = computed(() => this.entries().map((entry) => entry.date));
  protected readonly datasets = computed(() =>
    buildChartDatasets(this.entries(), this.benchmarkLine(), this.trendLine()),
  );
}
