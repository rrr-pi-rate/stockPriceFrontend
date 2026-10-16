import { Injectable } from '@angular/core';
import { DashboardService } from '@generated/api';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { DashboardRepositoryPort } from '../../../application/ports/outbound/dashboard-repository.port';
import { Deposit } from '../../../domain/models/deposit.model';
import { PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';
import { toDeposits, toPortfolioDataPoints } from './dashboard.mapper';

@Injectable()
export class DashboardApiAdapter extends DashboardRepositoryPort {
  private readonly historicalData$: Observable<PortfolioDataPoint[]>;
  private readonly deposits$: Observable<Deposit[]>;

  constructor(private readonly dashboardService: DashboardService) {
    super();
    // Cached so switching period/benchmark/trend doesn't re-fetch the full history from the backend.
    this.historicalData$ = this.dashboardService.dashboardDataGet().pipe(
      map(toPortfolioDataPoints),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    // A failing transactions call must not take the whole dashboard down (the use case combines
    // it with the portfolio data), so it degrades to "no deposits" and the return chart hides.
    this.deposits$ = this.dashboardService.dashboardTransactionsGet().pipe(
      map(toDeposits),
      catchError(() => of([])),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  override getHistoricalData(): Observable<PortfolioDataPoint[]> {
    return this.historicalData$;
  }

  override getDeposits(): Observable<Deposit[]> {
    return this.deposits$;
  }
}
