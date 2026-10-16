import { Injectable } from '@angular/core';
import { DashboardService } from '@generated/api';
import { Observable, map, of, shareReplay } from 'rxjs';
import { DashboardRepositoryPort } from '../../../application/ports/outbound/dashboard-repository.port';
import { Deposit } from '../../../domain/models/deposit.model';
import { PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';
import { toPortfolioDataPoints } from './dashboard.mapper';

@Injectable()
export class DashboardApiAdapter extends DashboardRepositoryPort {
  private readonly historicalData$: Observable<PortfolioDataPoint[]>;

  constructor(private readonly dashboardService: DashboardService) {
    super();
    // Cached so switching period/benchmark/trend doesn't re-fetch the full history from the backend.
    this.historicalData$ = this.dashboardService.dashboardDataGet().pipe(
      map(toPortfolioDataPoints),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  override getHistoricalData(): Observable<PortfolioDataPoint[]> {
    return this.historicalData$;
  }

  // TODO: the backend has no deposits endpoint yet - hook it up here once it exists.
  override getDeposits(): Observable<Deposit[]> {
    return of([]);
  }
}
