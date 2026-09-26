import { Injectable } from '@angular/core';
import { DashboardService } from '@generated/api';
import { Observable, map } from 'rxjs';
import { DashboardRepositoryPort } from '../../../application/ports/outbound/dashboard-repository.port';
import { PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';
import { toPortfolioDataPoints } from './dashboard.mapper';

@Injectable()
export class DashboardApiAdapter extends DashboardRepositoryPort {
  constructor(private readonly dashboardService: DashboardService) {
    super();
  }

  override getHistoricalData(): Observable<PortfolioDataPoint[]> {
    return this.dashboardService.dashboardDataGet().pipe(map(toPortfolioDataPoints));
  }
}
