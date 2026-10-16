import { Component, computed, input } from '@angular/core';
import { PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';
import { LineChart, LineChartDataset } from '../line-chart/line-chart';

/**
 * Afkast i kr.: porteføljeværdi minus alle indbetalinger til og med datoen. `entries` leverer
 * datoerne (x-aksen), `returnLine` er afkastet pr. entry (se computeReturnLine).
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

  protected readonly labels = computed(() => this.entries().map((entry) => entry.date));
  protected readonly datasets = computed<LineChartDataset[]>(() => [
    {
      label: 'Afkast',
      data: this.returnLine(),
      borderColor: '#00a976',
      backgroundColor: 'rgba(0, 169, 118, 0.2)',
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 5,
      fill: 'origin',
      tension: 0.3,
    },
  ]);
}
