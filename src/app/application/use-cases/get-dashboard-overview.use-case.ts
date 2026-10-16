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
import {
  computePeriodReturn,
  computeReturnBenchmarkPercentLine,
  computeReturnPercentLine,
} from '../../domain/calculations/return.calculator';
import { computeTrendLine } from '../../domain/calculations/trend.calculator';
import { Deposit } from '../../domain/models/deposit.model';
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

/** Percent values are small, so the return trend keeps 4 decimals instead of whole units. */
const RETURN_TREND_DECIMALS = 4;

export type BenchmarkSource =
  | { readonly kind: 'rate'; readonly rates: BenchmarkRates }
  | { readonly kind: 'line'; readonly points: readonly BenchmarkPoint[] };

function benchmarkLineFor(
  entries: readonly PortfolioDataPoint[],
  benchmark: BenchmarkKind | undefined,
  source: BenchmarkSource | null,
): (number | null)[] | null {
  if (!benchmark || !source) return null;
  return source.kind === 'rate'
    ? computeBenchmarkLine(entries, source.rates[benchmark])
    : alignBenchmarkLine(entries, source.points);
}

export function buildOverview(
  allEntries: readonly PortfolioDataPoint[],
  period: Period,
  options: DashboardOverviewOptions,
  benchmarkSource: BenchmarkSource | null,
  referenceDate: Date = new Date(),
  deposits: readonly Deposit[] = [],
  returnBenchmarkSource: BenchmarkSource | null = null,
): DashboardOverview {
  const periodEntries = filterByPeriod(allEntries, period, referenceDate);

  const benchmarkLine = benchmarkLineFor(periodEntries, options.benchmark, benchmarkSource);

  const returnPercentLine =
    deposits.length > 0 ? computeReturnPercentLine(periodEntries, deposits) : null;
  const returnBenchmarkBase = benchmarkLineFor(
    periodEntries,
    options.returnBenchmark,
    returnBenchmarkSource,
  );

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
      returnPercentLine,
      returnBenchmarkLine:
        returnPercentLine && returnBenchmarkBase
          ? computeReturnBenchmarkPercentLine(periodEntries, deposits, returnBenchmarkBase)
          : null,
      returnTrendLine:
        returnPercentLine && options.includeReturnTrend
          ? computeTrendLine(
              periodEntries.map((entry, i) => ({ date: entry.date, value: returnPercentLine[i] })),
              RETURN_TREND_DECIMALS,
            )
          : null,
      periodReturn: deposits.length > 0 ? computePeriodReturn(periodEntries, deposits) : null,
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
    return combineLatest([
      this.dashboardRepository.getHistoricalData(options.dataSource),
      this.getBenchmarkSource$(options.benchmark),
      this.dashboardRepository.getDeposits(options.dataSource),
      this.getBenchmarkSource$(options.returnBenchmark),
    ]).pipe(
      map(([allEntries, source, deposits, returnSource]) =>
        buildOverview(allEntries, period, options, source, referenceDate, deposits, returnSource),
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
