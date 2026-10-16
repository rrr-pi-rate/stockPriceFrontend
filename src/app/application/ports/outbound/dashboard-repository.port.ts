import { Observable, of } from 'rxjs';
import { Deposit } from '../../../domain/models/deposit.model';
import { DataSource, PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';

export abstract class DashboardRepositoryPort {
  abstract getHistoricalData(source?: DataSource): Observable<PortfolioDataPoint[]>;

  /** Defaults to no deposits, so the return chart stays hidden until a source provides them. */
  getDeposits(_source?: DataSource): Observable<Deposit[]> {
    return of([]);
  }
}
