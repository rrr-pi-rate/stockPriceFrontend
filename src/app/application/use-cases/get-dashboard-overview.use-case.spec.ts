import { firstValueFrom, Observable, of } from 'rxjs';
import { Deposit } from '../../domain/models/deposit.model';
import { PortfolioDataPoint } from '../../domain/models/portfolio-data-point.model';
import { BenchmarkPoint } from '../../domain/models/benchmark-point.model';
import { BenchmarkRateProviderPort, BenchmarkRates } from '../ports/outbound/benchmark-rate-provider.port';
import { BenchmarkLineProviderPort } from '../ports/outbound/benchmark-line-provider.port';
import { DashboardRepositoryPort } from '../ports/outbound/dashboard-repository.port';
import { buildOverview, GetDashboardOverviewUseCase } from './get-dashboard-overview.use-case';

const entries: PortfolioDataPoint[] = [
  { date: '2026-01-01', value: 1000 },
  { date: '2026-01-02', value: 1050 },
  { date: '2026-01-03', value: 1030 },
  { date: '2026-01-04', value: 1100 },
  { date: '2026-01-05', value: 1080 },
];

const rates: BenchmarkRates = { msci: 0.1, sp500: 0.11, omxc25: 0.08, inflation: 0.025, bonds: 0.03 };
const referenceDate = new Date('2026-09-26T00:00:00Z');

describe('buildOverview', () => {
  it('computes the full-history summary and period view for "all", with no trend/benchmark by default', () => {
    const overview = buildOverview(entries, { kind: 'all' }, {}, null, referenceDate);

    expect(overview.summary.latest).toEqual(entries[4]);
    expect(overview.summary.totalDataPoints).toBe(5);
    expect(overview.period.entries).toEqual(entries);
    expect(overview.period.pointCount).toBe(5);
    expect(overview.period.bestDay).toEqual({ date: '2026-01-04', change: 70 });
    expect(overview.period.trendLine).toBeNull();
    expect(overview.period.benchmarkLine).toBeNull();
  });

  it('includes a trend line when requested', () => {
    const overview = buildOverview(entries, { kind: 'all' }, { includeTrend: true }, null, referenceDate);
    expect(overview.period.trendLine).toEqual([1010, 1031, 1052, 1073, 1094]);
  });

  it('includes a benchmark line for the selected kind when rates are supplied', () => {
    const overview = buildOverview(
      entries,
      { kind: 'all' },
      { benchmark: 'msci' },
      { kind: 'rate', rates },
      referenceDate,
    );
    expect(overview.period.benchmarkLine?.[0]).toBeCloseTo(1000, 5);
  });

  it('omits the benchmark line when a benchmark is requested but no rates are available', () => {
    const overview = buildOverview(entries, { kind: 'all' }, { benchmark: 'msci' }, null, referenceDate);
    expect(overview.period.benchmarkLine).toBeNull();
  });

  it('scopes the period view to the requested period, independent of the full-history summary', () => {
    const periodReferenceDate = new Date('2026-01-05T00:00:00Z');
    const overview = buildOverview(entries, { kind: 'trailing-days', days: 0 }, {}, null, periodReferenceDate);
    expect(overview.summary.totalDataPoints).toBe(5);
    expect(overview.period.entries).toEqual([entries[4]]);
  });

  it('has no return line without deposits', () => {
    const overview = buildOverview(entries, { kind: 'all' }, {}, null, referenceDate);
    expect(overview.period.returnLine).toBeNull();
  });

  it('subtracts cumulative deposits from the value, using deposits from before the period', () => {
    const periodReferenceDate = new Date('2026-01-05T00:00:00Z');
    const deposits = [
      { date: '2026-01-01', amount: 1000 },
      { date: '2026-01-04', amount: 50 },
    ];
    const overview = buildOverview(
      entries,
      { kind: 'trailing-days', days: 1 },
      {},
      null,
      periodReferenceDate,
      deposits,
    );
    expect(overview.period.returnLine).toEqual([50, 30]);
  });

  describe('return chart overlays', () => {
    const deposits = [{ date: '2026-01-01', amount: 1000 }];
    const source = { kind: 'rate' as const, rates };

    it('has no return benchmark or trend unless the return chart asks for them', () => {
      const overview = buildOverview(entries, { kind: 'all' }, {}, null, referenceDate, deposits);
      expect(overview.period.returnLine).toEqual([0, 50, 30, 100, 80]);
      expect(overview.period.returnBenchmarkLine).toBeNull();
      expect(overview.period.returnTrendLine).toBeNull();
    });

    it('builds the return benchmark from the return chart option, starting level with the return', () => {
      const overview = buildOverview(
        entries,
        { kind: 'all' },
        { returnBenchmark: 'bonds' },
        null,
        referenceDate,
        deposits,
        source,
      );
      const line = overview.period.returnBenchmarkLine;
      expect(line?.[0]).toBeCloseTo(0, 5);
      // one day at 3 %/year on 1000 invested: 1000 * (1.03^(1/365) - 1)
      expect(line?.[1]).toBeCloseTo(1000 * (Math.pow(1.03, 1 / 365) - 1), 5);
    });

    it('keeps the portfolio chart and the return chart overlays independent', () => {
      const portfolioOnly = buildOverview(
        entries,
        { kind: 'all' },
        { benchmark: 'bonds', includeTrend: true },
        source,
        referenceDate,
        deposits,
      );
      expect(portfolioOnly.period.benchmarkLine).not.toBeNull();
      expect(portfolioOnly.period.trendLine).not.toBeNull();
      expect(portfolioOnly.period.returnBenchmarkLine).toBeNull();
      expect(portfolioOnly.period.returnTrendLine).toBeNull();

      const returnOnly = buildOverview(
        entries,
        { kind: 'all' },
        { returnBenchmark: 'bonds', includeReturnTrend: true },
        null,
        referenceDate,
        deposits,
        source,
      );
      expect(returnOnly.period.benchmarkLine).toBeNull();
      expect(returnOnly.period.trendLine).toBeNull();
      expect(returnOnly.period.returnBenchmarkLine).not.toBeNull();
      expect(returnOnly.period.returnTrendLine).toHaveLength(5);
    });

    it('fits the return trend to the return line, not to the portfolio value', () => {
      const overview = buildOverview(
        entries,
        { kind: 'all' },
        { includeReturnTrend: true },
        null,
        referenceDate,
        deposits,
      );
      // regression over [0, 50, 30, 100, 80]: slope 210 / 10 = 21, intercept 52 - 21 * 2 = 10
      expect(overview.period.returnTrendLine).toEqual([10, 31, 52, 73, 94]);
    });

    it('has no return overlays without deposits, even when asked for', () => {
      const overview = buildOverview(
        entries,
        { kind: 'all' },
        { returnBenchmark: 'bonds', includeReturnTrend: true },
        null,
        referenceDate,
        [],
        source,
      );
      expect(overview.period.returnLine).toBeNull();
      expect(overview.period.returnBenchmarkLine).toBeNull();
      expect(overview.period.returnTrendLine).toBeNull();
    });
  });
});

class FakeDashboardRepository extends DashboardRepositoryPort {
  constructor(private readonly entriesToReturn: PortfolioDataPoint[]) {
    super();
  }

  override getHistoricalData(): Observable<PortfolioDataPoint[]> {
    return of(this.entriesToReturn);
  }

  override getDeposits(): Observable<Deposit[]> {
    return of([]);
  }
}

class FakeBenchmarkRateProvider extends BenchmarkRateProviderPort {
  callCount = 0;

  constructor(private readonly ratesToReturn: BenchmarkRates) {
    super();
  }

  override getAnnualRates(): Observable<BenchmarkRates> {
    this.callCount++;
    return of(this.ratesToReturn);
  }
}

class FakeBenchmarkLineProvider extends BenchmarkLineProviderPort {
  callCount = 0;

  constructor(private readonly pointsToReturn: BenchmarkPoint[]) {
    super();
  }

  override getBenchmarkLine(): Observable<BenchmarkPoint[]> {
    this.callCount++;
    return of(this.pointsToReturn);
  }
}

describe('GetDashboardOverviewUseCase', () => {
  it('does not call the rate or line provider when no benchmark is requested', async () => {
    const rateProvider = new FakeBenchmarkRateProvider(rates);
    const lineProvider = new FakeBenchmarkLineProvider([]);
    const useCase = new GetDashboardOverviewUseCase(
      new FakeDashboardRepository(entries),
      rateProvider,
      lineProvider,
    );

    const overview = await firstValueFrom(useCase.execute({ kind: 'all' }, {}, referenceDate));

    expect(rateProvider.callCount).toBe(0);
    expect(lineProvider.callCount).toBe(0);
    expect(overview.period.benchmarkLine).toBeNull();
  });

  it('fetches rates and builds the benchmark line for a synthetic benchmark', async () => {
    const rateProvider = new FakeBenchmarkRateProvider(rates);
    const lineProvider = new FakeBenchmarkLineProvider([]);
    const useCase = new GetDashboardOverviewUseCase(
      new FakeDashboardRepository(entries),
      rateProvider,
      lineProvider,
    );

    const overview = await firstValueFrom(
      useCase.execute({ kind: 'all' }, { benchmark: 'bonds' }, referenceDate),
    );

    expect(rateProvider.callCount).toBe(1);
    expect(lineProvider.callCount).toBe(0);
    expect(overview.period.benchmarkLine?.[0]).toBeCloseTo(1000, 5);
  });

  it('fetches a benchmark line for a live benchmark', async () => {
    const rateProvider = new FakeBenchmarkRateProvider(rates);
    const points: BenchmarkPoint[] = entries.map((entry) => ({ date: entry.date, value: 1000 }));
    const lineProvider = new FakeBenchmarkLineProvider(points);
    const useCase = new GetDashboardOverviewUseCase(
      new FakeDashboardRepository(entries),
      rateProvider,
      lineProvider,
    );

    const overview = await firstValueFrom(
      useCase.execute({ kind: 'all' }, { benchmark: 'sp500' }, referenceDate),
    );

    expect(lineProvider.callCount).toBe(1);
    expect(rateProvider.callCount).toBe(0);
    expect(overview.period.benchmarkLine?.[0]).toBeCloseTo(1000, 5);
  });
});
