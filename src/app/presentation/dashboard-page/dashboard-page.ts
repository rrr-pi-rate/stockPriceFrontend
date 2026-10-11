import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { BadgeComponent } from '@kirbydesign/designsystem/badge';
import { CardComponent } from '@kirbydesign/designsystem/card';
import { LoadingOverlayComponent } from '@kirbydesign/designsystem/loading-overlay';
import { ToggleComponent } from '@kirbydesign/designsystem/toggle';
import { switchMap } from 'rxjs';
import { DashboardOverviewOptions } from '../../application/models/dashboard-overview.model';
import { GetDashboardOverviewUseCase } from '../../application/use-cases/get-dashboard-overview.use-case';
import { BenchmarkKind } from '../../domain/models/benchmark.model';
import { Period } from '../../domain/models/period.model';
import { BenchmarkPicker } from '../components/benchmark-picker/benchmark-picker';
import { PeriodSelector } from '../components/period-selector/period-selector';
import { PortfolioChart } from '../components/portfolio-chart/portfolio-chart';
import { StatCard } from '../components/stat-card/stat-card';
import { periodDescription } from '../formatting/period-label';
import { buildStatCards } from './dashboard-stat-cards';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    StatCard,
    PeriodSelector,
    PortfolioChart,
    CardComponent,
    BenchmarkPicker,
    ToggleComponent,
    BadgeComponent,
    LoadingOverlayComponent,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {
  private readonly getDashboardOverview = inject(GetDashboardOverviewUseCase);

  protected readonly period = signal<Period>({ kind: 'all' });
  protected readonly benchmarkEnabled = signal(false);
  protected readonly benchmark = signal<BenchmarkKind>('msci');
  protected readonly trendEnabled = signal(false);
  protected readonly fakeData = signal(true);

  protected readonly periodDescription = periodDescription;

  private readonly request = computed(() => ({
    period: this.period(),
    options: {
      benchmark: this.benchmarkEnabled() ? this.benchmark() : undefined,
      includeTrend: this.trendEnabled(),
      dataSource: this.fakeData() ? 'fake' : 'real',
    } satisfies DashboardOverviewOptions,
  }));

  protected readonly overview = toSignal(
    toObservable(this.request).pipe(
      switchMap(({ period, options }) => this.getDashboardOverview.execute(period, options)),
    ),
    { initialValue: null },
  );

  protected readonly cards = computed(() => buildStatCards(this.overview(), this.period()));
  protected readonly isLoading = computed(() => this.overview() === null);
}
