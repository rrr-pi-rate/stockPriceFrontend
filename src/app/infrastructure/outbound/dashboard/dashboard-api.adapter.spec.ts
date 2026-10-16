import { DashboardDataPointDto, DashboardService, DashboardTransactionDto } from '@generated/api';
import { firstValueFrom, of, throwError } from 'rxjs';
import { DashboardApiAdapter } from './dashboard-api.adapter';

describe('DashboardApiAdapter', () => {
  it('fetches data from the generated client and maps it to domain models', async () => {
    const dtos: DashboardDataPointDto[] = [
      { date: '2026-01-01', value: 1000 },
      { date: '2026-01-02', value: 1050 },
    ];
    const fakeDashboardService = {
      dashboardDataGet: () => of(dtos),
      dashboardTransactionsGet: () => of([]),
    } as unknown as DashboardService;

    const adapter = new DashboardApiAdapter(fakeDashboardService);
    const result = await firstValueFrom(adapter.getHistoricalData());

    expect(result).toEqual([
      { date: '2026-01-01', value: 1000 },
      { date: '2026-01-02', value: 1050 },
    ]);
  });

  it('fetches transactions from the generated client and maps them to deposits', async () => {
    const transactions: DashboardTransactionDto[] = [
      { bookingId: 'a', date: '2026-01-01', amount: 1000 },
      { bookingId: 'b', date: '2026-02-01', amount: -200 },
    ];
    const fakeDashboardService = {
      dashboardDataGet: () => of([]),
      dashboardTransactionsGet: () => of(transactions),
    } as unknown as DashboardService;

    const adapter = new DashboardApiAdapter(fakeDashboardService);
    const result = await firstValueFrom(adapter.getDeposits());

    expect(result).toEqual([
      { date: '2026-01-01', amount: 1000 },
      { date: '2026-02-01', amount: -200 },
    ]);
  });

  it('degrades to no deposits when the transactions call fails', async () => {
    const fakeDashboardService = {
      dashboardDataGet: () => of([]),
      dashboardTransactionsGet: () => throwError(() => new Error('boom')),
    } as unknown as DashboardService;

    const adapter = new DashboardApiAdapter(fakeDashboardService);

    expect(await firstValueFrom(adapter.getDeposits())).toEqual([]);
  });

  it('caches the underlying HTTP call so repeated subscriptions do not re-fetch', async () => {
    const dtos: DashboardDataPointDto[] = [{ date: '2026-01-01', value: 1000 }];
    let callCount = 0;
    const fakeDashboardService = {
      dashboardDataGet: () => {
        callCount++;
        return of(dtos);
      },
      dashboardTransactionsGet: () => of([]),
    } as unknown as DashboardService;

    const adapter = new DashboardApiAdapter(fakeDashboardService);
    await firstValueFrom(adapter.getHistoricalData());
    await firstValueFrom(adapter.getHistoricalData());
    await firstValueFrom(adapter.getHistoricalData());

    expect(callCount).toBe(1);
  });
});
