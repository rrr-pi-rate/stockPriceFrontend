import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { generateFakePortfolio } from '../../../domain/calculations/fake-portfolio.generator';
import { PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';

@Injectable()
export class FakeDashboardAdapter {
  private readonly data = generateFakePortfolio();

  getHistoricalData(): Observable<PortfolioDataPoint[]> {
    return of(this.data);
  }
}
