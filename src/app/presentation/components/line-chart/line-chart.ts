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
import {
  formatAxisPercentage,
  formatCompactNumber,
  formatCurrency,
  formatPercentage,
} from '../../formatting/number-formatting';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
);

export interface LineChartDataset {
  readonly label: string;
  readonly data: readonly (number | null)[];
  readonly spanGaps?: boolean;
  readonly borderColor: string;
  readonly backgroundColor: string;
  readonly borderWidth: number;
  readonly borderDash?: readonly number[];
  readonly pointRadius: number;
  readonly pointHoverRadius: number;
  readonly fill: boolean | 'origin';
  readonly tension: number;
  readonly order?: number;
}

type HoverableChart = Chart & { _hoverY?: number | null };

const crosshairPlugin = {
  id: 'crosshair',
  afterDraw(chart: HoverableChart) {
    if (chart._hoverY == null) return;
    const { ctx, chartArea } = chart;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(chartArea.left, chart._hoverY);
    ctx.lineTo(chartArea.right, chart._hoverY);
    ctx.strokeStyle = 'rgba(20, 36, 32, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  },
};

/**
 * Generic line chart: crosshair, tooltip in DKK, compact y-axis. The first dataset gets a
 * green gradient fill. Parents own the data - when `labels`/`datasets` change, the same
 * Chart.js dataset objects have their `.data` swapped (rather than being replaced), so the
 * lines morph between periods instead of popping in.
 */
@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.html',
  styleUrl: './line-chart.scss',
})
export class LineChart implements AfterViewInit, OnDestroy {
  readonly labels = input.required<readonly string[]>();
  readonly datasets = input.required<readonly LineChartDataset[]>();
  readonly height = input(400);
  /** Unit of the values: kroner (tooltip in DKK, compact axis) or percent. */
  readonly valueFormat = input<'currency' | 'percent'>('currency');

  @ViewChild('canvas') private readonly canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: HoverableChart | null = null;

  constructor() {
    effect(() => {
      const labels = this.labels();
      const datasets = this.datasets();
      if (!this.chart) return;

      this.chart.data.labels = [...labels];
      if (this.chart.data.datasets.length === datasets.length) {
        datasets.forEach((dataset, i) => {
          this.chart!.data.datasets[i].data = [...dataset.data] as (number | null)[];
        });
      } else {
        this.chart.data.datasets = this.withGradient(datasets);
      }
      this.chart.update();
    });
  }

  ngAfterViewInit(): void {
    if (!this.canvasRef.nativeElement.getContext('2d')) return;

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'line',
      data: {
        labels: [...this.labels()],
        datasets: this.withGradient(this.datasets()),
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

  private withGradient(datasets: readonly LineChartDataset[]) {
    const copies = datasets.map((dataset) => ({
      ...dataset,
      data: [...dataset.data],
      borderDash: dataset.borderDash ? [...dataset.borderDash] : undefined,
    }));
    if (copies.length > 0) copies[0] = { ...copies[0], backgroundColor: this.createGradient() };
    return copies;
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
              if (value == null) return `${ctx.dataset.label}: —`;
              const formatted =
                this.valueFormat() === 'percent' ? formatPercentage(value) : formatCurrency(value);
              return `${ctx.dataset.label}: ${formatted}`;
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
            callback: (value) =>
              this.valueFormat() === 'percent'
                ? formatAxisPercentage(Number(value))
                : formatCompactNumber(Number(value)),
          },
          grid: { color: '#eef2f0' },
        },
      },
    };
  }
}
