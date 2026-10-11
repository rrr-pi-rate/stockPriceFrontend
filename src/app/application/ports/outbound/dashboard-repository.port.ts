import { Observable } from 'rxjs';
import { DataSource, PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';

export abstract class DashboardRepositoryPort {
  abstract getHistoricalData(source?: DataSource): Observable<PortfolioDataPoint[]>;
}
