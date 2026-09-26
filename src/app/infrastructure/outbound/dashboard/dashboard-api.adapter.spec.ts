import { DashboardDataPointDto, DashboardService } from '@generated/api';
import { firstValueFrom, of } from 'rxjs';
import { DashboardApiAdapter } from './dashboard-api.adapter';

describe('DashboardApiAdapter', () => {
  it('fetches data from the generated client and maps it to domain models', async () => {
    const dtos: DashboardDataPointDto[] = [
      { date: '2026-01-01', value: 1000 },
      { date: '2026-01-02', value: 1050 },
    ];
    const fakeDashboardService = {
      dashboardDataGet: () => of(dtos),
    } as unknown as DashboardService;

    const adapter = new DashboardApiAdapter(fakeDashboardService);
    const result = await firstValueFrom(adapter.getHistoricalData());

    expect(result).toEqual([
      { date: '2026-01-01', value: 1000 },
      { date: '2026-01-02', value: 1050 },
    ]);
  });

  it('caches the underlying HTTP call so repeated subscriptions do not re-fetch', async () => {
    const dtos: DashboardDataPointDto[] = [{ date: '2026-01-01', value: 1000 }];
    let callCount = 0;
    const fakeDashboardService = {
      dashboardDataGet: () => {
        callCount++;
        return of(dtos);
      },
    } as unknown as DashboardService;

    const adapter = new DashboardApiAdapter(fakeDashboardService);
    await firstValueFrom(adapter.getHistoricalData());
    await firstValueFrom(adapter.getHistoricalData());
    await firstValueFrom(adapter.getHistoricalData());

    expect(callCount).toBe(1);
  });
});
