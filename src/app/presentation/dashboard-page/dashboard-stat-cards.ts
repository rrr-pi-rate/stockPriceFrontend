import { DashboardOverview } from '../../application/models/dashboard-overview.model';
import { Period } from '../../domain/models/period.model';
import { StatCardTone } from '../components/stat-card/stat-card';
import { formatCurrency, formatPercentage, toneFor } from '../formatting/number-formatting';
import { periodDescription } from '../formatting/period-label';

export interface StatCardViewModel {
  readonly label: string;
  readonly value: string;
  readonly sub?: string;
  readonly tone?: StatCardTone;
}

const PLACEHOLDER_LABELS = [
  'Latest total',
  'Change (1 day)',
  'YTD change',
  'Total data points',
  'Change in the period',
  'Return in the period',
  'Data points in the period',
  'Best day in the period',
] as const;

export function buildStatCards(
  overview: DashboardOverview | null,
  selectedPeriod: Period,
): StatCardViewModel[] {
  if (!overview) {
    return PLACEHOLDER_LABELS.map((label) => ({ label, value: '—' }));
  }

  const { summary, period } = overview;

  return [
    {
      label: 'Latest total',
      value: summary.latest ? formatCurrency(summary.latest.value) : '—',
      sub: summary.latest?.date ?? '—',
    },
    {
      label: 'Change (1 day)',
      value: summary.dayChange ? formatCurrency(summary.dayChange.absolute) : '—',
      sub: summary.dayChange ? formatPercentage(summary.dayChange.percentage) : '—',
      tone: summary.dayChange ? toneFor(summary.dayChange.absolute) : undefined,
    },
    {
      label: 'YTD change',
      value: summary.yearToDateChange ? formatCurrency(summary.yearToDateChange.absolute) : '—',
      sub: summary.yearToDateChange ? formatPercentage(summary.yearToDateChange.percentage) : '—',
      tone: summary.yearToDateChange ? toneFor(summary.yearToDateChange.absolute) : undefined,
    },
    {
      label: 'Total data points',
      value: String(summary.totalDataPoints),
      sub: summary.dateRange ? `${summary.dateRange.from} → ${summary.dateRange.to}` : '—',
    },
    {
      label: 'Change in the period',
      value: period.change ? formatCurrency(period.change.absolute) : '—',
      sub: period.change ? formatPercentage(period.change.percentage) : '—',
      tone: period.change ? toneFor(period.change.absolute) : undefined,
    },
    {
      label: 'Return in the period',
      value: period.periodReturn ? formatPercentage(period.periodReturn.percentage) : '—',
      sub: period.periodReturn ? formatCurrency(period.periodReturn.absolute) : '—',
      tone: period.periodReturn ? toneFor(period.periodReturn.absolute) : undefined,
    },
    {
      label: 'Data points in the period',
      value: String(period.pointCount),
      sub: `af ${summary.totalDataPoints} total · ${periodDescription(selectedPeriod)}`,
    },
    {
      label: 'Best day in the period',
      value: period.bestDay ? formatCurrency(period.bestDay.change) : '—',
      sub: period.bestDay?.date ?? '—',
      tone: period.bestDay ? toneFor(period.bestDay.change) : undefined,
    },
  ];
}
