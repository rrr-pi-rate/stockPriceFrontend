import { Injectable } from '@angular/core';
import { Observable, combineLatest, map, of } from 'rxjs';
import { computeBenchmarkLine } from '../../domain/calculations/benchmark.calculator';
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
import { BenchmarkRateProviderPort, BenchmarkRates } from '../ports/outbound/benchmark-rate-provider.port';
import { DashboardRepositoryPort } from '../ports/outbound/dashboard-repository.port';

export function buildOverview(
  allEntries: readonly PortfolioDataPoint[],
  period: Period,
  options: DashboardOverviewOptions,
  rates: BenchmarkRates | null,
  referenceDate: Date = new Date(),
): DashboardOverview {
  const periodEntries = filterByPeriod(allEntries, period, referenceDate);

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
      benchmarkLine:
        options.benchmark && rates ? computeBenchmarkLine(periodEntries, rates[options.benchmark]) : null,
    },
  };
}

@Injectable({ providedIn: 'root' })
export class GetDashboardOverviewUseCase {
  constructor(
    private readonly dashboardRepository: DashboardRepositoryPort,
    private readonly benchmarkRateProvider: BenchmarkRateProviderPort,
  ) {}

  execute(
    period: Period,
    options: DashboardOverviewOptions = {},
    referenceDate: Date = new Date(),
  ): Observable<DashboardOverview> {
    const rates$: Observable<BenchmarkRates | null> = options.benchmark
      ? this.benchmarkRateProvider.getAnnualRates()
      : of(null);

    return combineLatest([this.dashboardRepository.getHistoricalData(), rates$]).pipe(
      map(([allEntries, rates]) => buildOverview(allEntries, period, options, rates, referenceDate)),
    );
  }
}
