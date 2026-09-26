import { DashboardDataPointDto } from '@generated/api';
import { toPortfolioDataPoints } from './dashboard.mapper';

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
