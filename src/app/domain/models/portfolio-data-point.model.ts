export type DataSource = 'real' | 'fake';

export interface PortfolioDataPoint {
  readonly date: string;
  readonly value: number;
}
