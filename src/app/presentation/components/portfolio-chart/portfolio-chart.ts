import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, effect, input } from '@angular/core';
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
import { buildChartDatasets } from './portfolio-chart-datasets';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

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

@Component({
  selector: 'app-portfolio-chart',
  templateUrl: './portfolio-chart.html',
  styleUrl: './portfolio-chart.scss',
})
export class PortfolioChart implements AfterViewInit, OnDestroy {
  readonly entries = input.required<readonly PortfolioDataPoint[]>();
  readonly benchmarkLine = input<readonly number[] | null>(null);
  readonly trendLine = input<readonly number[] | null>(null);

  @ViewChild('canvas') private readonly canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: HoverableChart | null = null;

  constructor() {
    effect(() => {
      const labels = this.entries().map((entry) => entry.date);
      const datasets = buildChartDatasets(this.entries(), this.benchmarkLine(), this.trendLine());
      if (!this.chart) return;

      datasets[0] = { ...datasets[0], backgroundColor: this.createGradient() };
      this.chart.data.labels = labels;
      this.chart.data.datasets = datasets;
      this.chart.update();
    });
  }

  ngAfterViewInit(): void {
    if (!this.canvasRef.nativeElement.getContext('2d')) return;

    const datasets = buildChartDatasets(this.entries(), this.benchmarkLine(), this.trendLine());
    datasets[0] = { ...datasets[0], backgroundColor: this.createGradient() };

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.entries().map((entry) => entry.date),
        datasets,
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
      animation: false,
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
            label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#5c6b66', maxTicksLimit: 8 },
          grid: { color: '#eef2f0' },
        },
        y: {
          ticks: { color: '#5c6b66', callback: (value) => formatCompactNumber(Number(value)) },
          grid: { color: '#eef2f0' },
        },
      },
    };
  }
}
