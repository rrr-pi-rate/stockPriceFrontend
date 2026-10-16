import { DashboardOverview } from '../../application/models/dashboard-overview.model';
import { Period } from '../../domain/models/period.model';
import { buildStatCards } from './dashboard-stat-cards';

const allHistory: Period = { kind: 'all' };

const overview: DashboardOverview = {
  summary: {
    latest: { date: '2026-01-05', value: 1080 },
    dayChange: { absolute: -20, percentage: -1.8181818181818181 },
    yearToDateChange: { absolute: 80, percentage: 8 },
    totalDataPoints: 5,
    dateRange: { from: '2026-01-01', to: '2026-01-05' },
  },
  period: {
    entries: [],
    change: { absolute: 80, percentage: 8 },
    pointCount: 5,
    bestDay: { date: '2026-01-04', change: 70 },
    volatility: 40.62019202317978,
    trendLine: null,
    benchmarkLine: null,
    returnPercentLine: null,
    returnBenchmarkLine: null,
    returnTrendLine: null,
    periodReturn: { absolute: 50, percentage: 4.5 },
  },
};

describe('buildStatCards', () => {
  it('returns 8 placeholder cards with an em dash when there is no overview yet', () => {
    const cards = buildStatCards(null, allHistory);
    expect(cards).toHaveLength(8);
    expect(cards.every((c) => c.value === '—')).toBe(true);
  });

  it('formats the full-history summary cards', () => {
    const cards = buildStatCards(overview, allHistory);

    expect(cards[0]).toMatchObject({ label: 'Latest total', sub: '2026-01-05' });
    expect(cards[0].value).toContain('1.080');

    expect(cards[1]).toMatchObject({ label: 'Change (1 day)', tone: 'negative' });
    expect(cards[1].sub).toBe('-1.82 %');

    expect(cards[2]).toMatchObject({ label: 'YTD change', tone: 'positive' });
    expect(cards[2].sub).toBe('+8.00 %');

    expect(cards[3]).toMatchObject({
      label: 'Total data points',
      value: '5',
      sub: '2026-01-01 → 2026-01-05',
    });
  });

  it('formats the period-scoped cards, including the selected period in the point-count sub text', () => {
    const cards = buildStatCards(overview, { kind: 'trailing-days', days: 30 });

    expect(cards[4]).toMatchObject({ label: 'Change in the period', tone: 'positive', sub: '+8.00 %' });
    expect(cards[5]).toMatchObject({
      label: 'Return in the period',
      sub: '+4.50 %',
      tone: 'positive',
    });
    expect(cards[5].value).toContain('50');
    expect(cards[6]).toMatchObject({
      label: 'Data points in the period',
      value: '5',
      sub: 'af 5 total · 1 Month',
    });
    expect(cards[7]).toMatchObject({
      label: 'Best day in the period',
      sub: '2026-01-04',
      tone: 'positive',
    });
  });

  it('shows a dash on the return card when the period return is unknown', () => {
    const cards = buildStatCards(
      { ...overview, period: { ...overview.period, periodReturn: null } },
      allHistory,
    );
    expect(cards[5]).toMatchObject({ label: 'Return in the period', value: '—', sub: '—' });
  });
});
