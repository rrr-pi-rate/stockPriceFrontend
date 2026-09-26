import { Period } from '../../domain/models/period.model';

const TRAILING_DAYS_LABELS: Readonly<Record<number, string>> = {
  7: '1 Week',
  30: '1 Month',
  90: '3 Months',
  180: '6 Months',
  365: '1 Year',
};

export function periodDescription(period: Period): string {
  switch (period.kind) {
    case 'all':
      return 'All history';
    case 'ytd':
      return 'Year to date';
    case 'trailing-days':
      return TRAILING_DAYS_LABELS[period.days] ?? `${period.days}d`;
  }
}
