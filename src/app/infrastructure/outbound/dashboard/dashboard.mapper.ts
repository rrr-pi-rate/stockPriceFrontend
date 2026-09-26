import { DashboardDataPointDto } from '@generated/api';
import { PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';

export function toPortfolioDataPoint(dto: DashboardDataPointDto): PortfolioDataPoint {
  return { date: dto.date, value: dto.value };
}

export function toPortfolioDataPoints(dtos: readonly DashboardDataPointDto[]): PortfolioDataPoint[] {
  return dtos.map(toPortfolioDataPoint);
}
