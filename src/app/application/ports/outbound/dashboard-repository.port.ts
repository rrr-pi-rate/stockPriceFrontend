import { Observable } from 'rxjs';
import { Deposit } from '../../../domain/models/deposit.model';
import { DataSource, PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';

export abstract class DashboardRepositoryPort {
  abstract getHistoricalData(source?: DataSource): Observable<PortfolioDataPoint[]>;

  abstract getDeposits(source?: DataSource): Observable<Deposit[]>;
}
