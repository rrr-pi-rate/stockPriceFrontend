import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  input,
} from '@angular/core';
import {
  ActiveElement,
  CategoryScale,
  Chart,
  ChartEvent,
  ChartOptions,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';
import { formatCompactNumber, formatCurrency } from '../../formatting/number-formatting';
import { HoverableChart, crosshairPlugin } from '../portfolio-chart/portfolio-chart';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
);

/**
 * Afkast i kr.: porteføljeværdi minus alle indbetalinger til og med datoen. `entries` leverer
 * datoerne (x-aksen), `returnLine` er afkastet pr. entry (se computeReturnLine).
 */
@Component({
  selector: 'app-return-chart',
  templateUrl: './return-chart.html',
  styleUrl: './return-chart.scss',
})
export class ReturnChart implements AfterViewInit, OnDestroy {
  readonly entries = input.required<readonly PortfolioDataPoint[]>();
  readonly returnLine = input.required<readonly number[]>();

  @ViewChild('canvas') private readonly canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: HoverableChart | null = null;

  constructor() {
    effect(() => {
      const entries = this.entries();
      const returnLine = this.returnLine();
      if (!this.chart) return;

      this.chart.data.labels = entries.map((entry) => entry.date);
      this.chart.data.datasets[0].data = [...returnLine];
      this.chart.update();
    });
  }

  ngAfterViewInit(): void {
    if (!this.canvasRef.nativeElement.getContext('2d')) return;

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.entries().map((entry) => entry.date),
        datasets: [
          {
            label: 'Afkast',
            data: [...this.returnLine()],
            borderColor: '#00a976',
            backgroundColor: this.createGradient(),
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            fill: 'origin',
            tension: 0.3,
          },
        ],
      },
      plugins: [crosshairPlugin],
      options: this.buildOptions(),
    });

    this.canvasRef.nativeElement.addEventListener('mouseleave', () => {
      if (!this.chart) return;
      this.chart._hoverY = null;
      this.chart.update('none');
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private createGradient(): string {
    const ctx = this.canvasRef?.nativeElement.getContext('2d');
    if (!ctx) return 'rgba(0, 169, 118, 0.2)';

    const gradient = ctx.createLinearGradient(0, 0, 0, 320);
    gradient.addColorStop(0, 'rgba(0, 169, 118, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 169, 118, 0)');
    return gradient as unknown as string;
  }

  private buildOptions(): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200, easing: 'easeOutQuart' },
      interaction: { mode: 'index', intersect: false },
      onHover: (_event: ChartEvent, elements: ActiveElement[], chart: Chart) => {
        const hoverableChart = chart as HoverableChart;
        if (!elements.length) {
          hoverableChart._hoverY = null;
          return;
        }
        const { datasetIndex, index } = elements[0];
        const value = chart.data.datasets[datasetIndex].data[index] as number;
        hoverableChart._hoverY = chart.scales['y'].getPixelForValue(value);
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const value = ctx.parsed.y;
              return value == null
                ? `${ctx.dataset.label}: —`
                : `${ctx.dataset.label}: ${formatCurrency(value)}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#5c6b66', maxTicksLimit: 8, maxRotation: 0, minRotation: 0 },
          grid: { color: '#eef2f0' },
        },
        y: {
          ticks: {
            color: '#5c6b66',
            callback: (value) => formatCompactNumber(Number(value)),
          },
          grid: { color: '#eef2f0' },
        },
      },
    };
  }
}
