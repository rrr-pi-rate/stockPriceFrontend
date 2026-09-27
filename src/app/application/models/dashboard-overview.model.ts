import { BestDay } from '../../domain/calculations/portfolio-stats.calculator';
import { BenchmarkKind } from '../../domain/models/benchmark.model';
import { PortfolioDataPoint } from '../../domain/models/portfolio-data-point.model';
import { ValueChange } from '../../domain/models/value-change.model';

export interface DashboardOverviewOptions {
  readonly benchmark?: BenchmarkKind;
  readonly includeTrend?: boolean;
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
}

export interface DashboardOverview {
  readonly summary: DashboardSummary;
  readonly period: DashboardPeriodView;
}
