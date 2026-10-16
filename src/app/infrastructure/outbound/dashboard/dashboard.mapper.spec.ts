import { DashboardDataPointDto, DashboardTransactionDto } from '@generated/api';
import { toDeposits, toPortfolioDataPoints } from './dashboard.mapper';

describe('toPortfolioDataPoints', () => {
  it('maps each DTO to a domain PortfolioDataPoint', () => {
    const dtos: DashboardDataPointDto[] = [
      { date: '2026-01-01', value: 1000 },
      { date: '2026-01-02', value: 1050 },
    ];

    expect(toPortfolioDataPoints(dtos)).toEqual([
      { date: '2026-01-01', value: 1000 },
      { date: '2026-01-02', value: 1050 },
    ]);
  });

  it('maps an empty list to an empty list', () => {
    expect(toPortfolioDataPoints([])).toEqual([]);
  });
});

describe('toDeposits', () => {
  it('maps each transaction DTO to a Deposit, dropping the booking id', () => {
    const dtos: DashboardTransactionDto[] = [
      { bookingId: 'a', date: '2026-01-01', amount: 1000 },
      { bookingId: 'b', date: '2026-02-01', amount: -200 },
    ];

    expect(toDeposits(dtos)).toEqual([
      { date: '2026-01-01', amount: 1000 },
      { date: '2026-02-01', amount: -200 },
    ]);
  });

  it('maps an empty list to an empty list', () => {
    expect(toDeposits([])).toEqual([]);
  });
});
