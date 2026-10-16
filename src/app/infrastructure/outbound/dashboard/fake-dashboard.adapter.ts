import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { generateFakeDeposits, generateFakePortfolio } from '../../../domain/calculations/fake-portfolio.generator';
import { Deposit } from '../../../domain/models/deposit.model';
import { PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';

@Injectable()
export class FakeDashboardAdapter {
  private readonly data = generateFakePortfolio();
  private readonly deposits = generateFakeDeposits();

  getHistoricalData(): Observable<PortfolioDataPoint[]> {
    return of(this.data);
  }

  getDeposits(): Observable<Deposit[]> {
    return of(this.deposits);
  }
}
