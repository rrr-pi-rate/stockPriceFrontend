import { firstValueFrom, Observable, of } from 'rxjs';
import { PortfolioDataPoint } from '../../domain/models/portfolio-data-point.model';
import { BenchmarkRateProviderPort, BenchmarkRates } from '../ports/outbound/benchmark-rate-provider.port';
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
    const overview = buildOverview(entries, { kind: 'all' }, { benchmark: 'msci' }, rates, referenceDate);
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
});

class FakeDashboardRepository extends DashboardRepositoryPort {
  constructor(private readonly entriesToReturn: PortfolioDataPoint[]) {
    super();
  }

  override getHistoricalData(): Observable<PortfolioDataPoint[]> {
    return of(this.entriesToReturn);
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

describe('GetDashboardOverviewUseCase', () => {
  it('does not call the rate provider when no benchmark is requested', async () => {
    const rateProvider = new FakeBenchmarkRateProvider(rates);
    const useCase = new GetDashboardOverviewUseCase(new FakeDashboardRepository(entries), rateProvider);

    const overview = await firstValueFrom(useCase.execute({ kind: 'all' }, {}, referenceDate));

    expect(rateProvider.callCount).toBe(0);
    expect(overview.period.benchmarkLine).toBeNull();
  });

  it('fetches rates and builds the benchmark line when a benchmark is requested', async () => {
    const rateProvider = new FakeBenchmarkRateProvider(rates);
    const useCase = new GetDashboardOverviewUseCase(new FakeDashboardRepository(entries), rateProvider);

    const overview = await firstValueFrom(
      useCase.execute({ kind: 'all' }, { benchmark: 'sp500' }, referenceDate),
    );

    expect(rateProvider.callCount).toBe(1);
    expect(overview.period.benchmarkLine?.[0]).toBeCloseTo(1000, 5);
  });
});
