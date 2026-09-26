import { Observable } from 'rxjs';
import { PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';

export abstract class DashboardRepositoryPort {
  abstract getHistoricalData(): Observable<PortfolioDataPoint[]>;
}
