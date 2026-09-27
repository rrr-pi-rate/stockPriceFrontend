import { Injectable } from '@angular/core';
import { Observable, combineLatest, map, of } from 'rxjs';
import {
  alignBenchmarkLine,
  computeBenchmarkLine,
} from '../../domain/calculations/benchmark.calculator';
import { filterByPeriod } from '../../domain/calculations/period-filter';
import {
  bestDay,
  dateRange,
  dayOverDayChange,
  latestDataPoint,
  periodChange,
  volatility,
  yearToDateChange,
} from '../../domain/calculations/portfolio-stats.calculator';
import { computeTrendLine } from '../../domain/calculations/trend.calculator';
import { Period } from '../../domain/models/period.model';
import { PortfolioDataPoint } from '../../domain/models/portfolio-data-point.model';
import { DashboardOverview, DashboardOverviewOptions } from '../models/dashboard-overview.model';
import {
  BenchmarkRateProviderPort,
  BenchmarkRates,
} from '../ports/outbound/benchmark-rate-provider.port';
import { DashboardRepositoryPort } from '../ports/outbound/dashboard-repository.port';
import { BenchmarkPoint } from '../../domain/models/benchmark-point.model';
import { BenchmarkKind, isLiveBenchmark } from '../../domain/models/benchmark.model';
import { BenchmarkLineProviderPort } from '../ports/outbound/benchmark-line-provider.port';

export type BenchmarkSource =
  | { readonly kind: 'rate'; readonly rates: BenchmarkRates }
  | { readonly kind: 'line'; readonly points: readonly BenchmarkPoint[] };

export function buildOverview(
  allEntries: readonly PortfolioDataPoint[],
  period: Period,
  options: DashboardOverviewOptions,
  benchmarkSource: BenchmarkSource | null,
  referenceDate: Date = new Date(),
): DashboardOverview {
  const periodEntries = filterByPeriod(allEntries, period, referenceDate);

  const benchmarkLine =
    options.benchmark && benchmarkSource
      ? benchmarkSource.kind === 'rate'
        ? computeBenchmarkLine(periodEntries, benchmarkSource.rates[options.benchmark])
        : alignBenchmarkLine(periodEntries, benchmarkSource.points)
      : null;

  return {
    summary: {
      latest: latestDataPoint(allEntries),
      dayChange: dayOverDayChange(allEntries),
      yearToDateChange: yearToDateChange(allEntries, referenceDate),
      totalDataPoints: allEntries.length,
      dateRange: dateRange(allEntries),
    },
    period: {
      entries: periodEntries,
      change: periodChange(periodEntries),
      pointCount: periodEntries.length,
      bestDay: bestDay(periodEntries),
      volatility: volatility(periodEntries),
      trendLine: options.includeTrend ? computeTrendLine(periodEntries) : null,
      benchmarkLine,
    },
  };
}

@Injectable({ providedIn: 'root' })
export class GetDashboardOverviewUseCase {
  constructor(
    private readonly dashboardRepository: DashboardRepositoryPort,
    private readonly benchmarkRateProvider: BenchmarkRateProviderPort,
    private readonly benchmarkLineProvider: BenchmarkLineProviderPort,
  ) {}

  execute(
    period: Period,
    options: DashboardOverviewOptions = {},
    referenceDate: Date = new Date(),
  ): Observable<DashboardOverview> {
    const source$: Observable<BenchmarkSource | null> = this.getBenchmarkSource$(options.benchmark);

    return combineLatest([this.dashboardRepository.getHistoricalData(), source$]).pipe(
      map(([allEntries, source]) =>
        buildOverview(allEntries, period, options, source, referenceDate),
      ),
    );
  }

  private getBenchmarkSource$(
    benchmark: BenchmarkKind | undefined,
  ): Observable<BenchmarkSource | null> {
    if (!benchmark) return of(null);

    return isLiveBenchmark(benchmark)
      ? this.benchmarkLineProvider
          .getBenchmarkLine(benchmark)
          .pipe(map((points) => ({ kind: 'line' as const, points })))
      : this.benchmarkRateProvider
          .getAnnualRates()
          .pipe(map((rates) => ({ kind: 'rate' as const, rates })));
  }
}
