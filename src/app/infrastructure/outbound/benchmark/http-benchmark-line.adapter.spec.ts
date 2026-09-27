import { BenchmarkDataPointDto, DashboardService } from '@generated/api';
import { firstValueFrom, of, throwError } from 'rxjs';
import { HttpBenchmarkLineAdapter } from './http-benchmark-line.adapter';

function fakeDashboardService(dtos: BenchmarkDataPointDto[]): {
  service: DashboardService;
  calls: string[];
} {
  const calls: string[] = [];
  const service = {
    dashboardBenchmarkGet: (symbol: string) => {
      calls.push(symbol);
      return of(dtos);
    },
  } as unknown as DashboardService;
  return { service, calls };
}

describe('HttpBenchmarkLineAdapter', () => {
  it('maps DTOs to domain BenchmarkPoints, requesting the Yahoo symbol for the benchmark', async () => {
    const dtos: BenchmarkDataPointDto[] = [
      { date: '2026-01-01', value: 1000 },
      { date: '2026-01-02', value: 1010 },
    ];
    const { service, calls } = fakeDashboardService(dtos);

    const adapter = new HttpBenchmarkLineAdapter(service);
    const result = await firstValueFrom(adapter.getBenchmarkLine('sp500'));

    expect(calls).toEqual(['^GSPC']);
    expect(result).toEqual([
      { date: '2026-01-01', value: 1000 },
      { date: '2026-01-02', value: 1010 },
    ]);
  });

  it('caches the underlying HTTP call per benchmark so repeated subscriptions do not re-fetch', async () => {
    const { service, calls } = fakeDashboardService([{ date: '2026-01-01', value: 1000 }]);
    const adapter = new HttpBenchmarkLineAdapter(service);

    await firstValueFrom(adapter.getBenchmarkLine('msci'));
    await firstValueFrom(adapter.getBenchmarkLine('msci'));
    await firstValueFrom(adapter.getBenchmarkLine('msci'));

    expect(calls).toEqual(['URTH']);
  });

  it('requests independently and caches separately per benchmark kind', async () => {
    const { service, calls } = fakeDashboardService([{ date: '2026-01-01', value: 1000 }]);
    const adapter = new HttpBenchmarkLineAdapter(service);

    await firstValueFrom(adapter.getBenchmarkLine('msci'));
    await firstValueFrom(adapter.getBenchmarkLine('omxc25'));

    expect(calls).toEqual(['URTH', '^OMXC25']);
  });

  it('throws for a benchmark kind with no Yahoo symbol mapping', () => {
    const { service } = fakeDashboardService([]);
    const adapter = new HttpBenchmarkLineAdapter(service);

    expect(() => adapter.getBenchmarkLine('inflation')).toThrow(
      'No Yahoo symbol mapping for benchmark "inflation"',
    );
  });

  it('evicts the cache entry on failure so a later call retries instead of replaying the same error', async () => {
    const calls: string[] = [];
    let shouldFail = true;
    const service = {
      dashboardBenchmarkGet: (symbol: string) => {
        calls.push(symbol);
        return shouldFail ? throwError(() => new Error('network error')) : of([{ date: '2026-01-01', value: 1000 }]);
      },
    } as unknown as DashboardService;
    const adapter = new HttpBenchmarkLineAdapter(service);

    await expect(firstValueFrom(adapter.getBenchmarkLine('sp500'))).rejects.toThrow('network error');

    shouldFail = false;
    const result = await firstValueFrom(adapter.getBenchmarkLine('sp500'));

    expect(calls).toEqual(['^GSPC', '^GSPC']);
    expect(result).toEqual([{ date: '2026-01-01', value: 1000 }]);
  });
});
