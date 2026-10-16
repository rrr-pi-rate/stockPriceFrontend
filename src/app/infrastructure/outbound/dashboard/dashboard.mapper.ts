import { DashboardDataPointDto, DashboardTransactionDto } from '@generated/api';
import { Deposit } from '../../../domain/models/deposit.model';
import { PortfolioDataPoint } from '../../../domain/models/portfolio-data-point.model';

export function toPortfolioDataPoint(dto: DashboardDataPointDto): PortfolioDataPoint {
  return { date: dto.date, value: dto.value };
}

export function toPortfolioDataPoints(dtos: readonly DashboardDataPointDto[]): PortfolioDataPoint[] {
  return dtos.map(toPortfolioDataPoint);
}

export function toDeposit(dto: DashboardTransactionDto): Deposit {
  return { date: dto.date, amount: dto.amount };
}

export function toDeposits(dtos: readonly DashboardTransactionDto[]): Deposit[] {
  return dtos.map(toDeposit);
}
