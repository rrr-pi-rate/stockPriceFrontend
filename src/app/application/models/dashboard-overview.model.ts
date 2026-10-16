import { BestDay } from '../../domain/calculations/portfolio-stats.calculator';
import { BenchmarkKind } from '../../domain/models/benchmark.model';
import { DataSource, PortfolioDataPoint } from '../../domain/models/portfolio-data-point.model';
import { ValueChange } from '../../domain/models/value-change.model';

export interface DashboardOverviewOptions {
  readonly benchmark?: BenchmarkKind;
  readonly includeTrend?: boolean;
  /** Benchmark / trend for the return chart - independent of the portfolio chart's. */
  readonly returnBenchmark?: BenchmarkKind;
  readonly includeReturnTrend?: boolean;
  readonly dataSource?: DataSource;
}

export interface DashboardSummary {
  readonly latest: PortfolioDataPoint | null;
  readonly dayChange: ValueChange | null;
  readonly yearToDateChange: ValueChange | null;
  readonly totalDataPoints: number;
  readonly dateRange: { readonly from: string; readonly to: string } | null;
}

export interface DashboardPeriodView {
  readonly entries: readonly PortfolioDataPoint[];
  readonly change: ValueChange | null;
  readonly pointCount: number;
  readonly bestDay: BestDay | null;
  readonly volatility: number | null;
  readonly trendLine: readonly number[] | null;
  readonly benchmarkLine: readonly (number | null)[] | null;
  /** Value minus cumulative deposits per entry; null when no deposits are known. */
  readonly returnLine: readonly number[] | null;
  readonly returnBenchmarkLine: readonly (number | null)[] | null;
  readonly returnTrendLine: readonly number[] | null;
  /** Deposit-adjusted return over the period (DKK and %); null without deposits or enough data. */
  readonly periodReturn: ValueChange | null;
}

export interface DashboardOverview {
  readonly summary: DashboardSummary;
  readonly period: DashboardPeriodView;
}
