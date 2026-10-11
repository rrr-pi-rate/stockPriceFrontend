import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardRepositoryPort } from '../../../application/ports/outbound/dashboard-repository.port';
import { DataSource, PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';
import { DashboardApiAdapter } from './dashboard-api.adapter';
import { FakeDashboardAdapter } from './fake-dashboard.adapter';

@Injectable()
export class SwitchingDashboardAdapter extends DashboardRepositoryPort {
  constructor(
    private readonly real: DashboardApiAdapter,
    private readonly fake: FakeDashboardAdapter,
  ) {
    super();
  }

  override getHistoricalData(source: DataSource = 'real'): Observable<PortfolioDataPoint[]> {
    return source === 'fake' ? this.fake.getHistoricalData() : this.real.getHistoricalData();
  }
}
