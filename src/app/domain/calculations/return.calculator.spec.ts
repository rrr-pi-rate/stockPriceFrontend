import { computeReturnLine } from './return.calculator';

describe('computeReturnLine', () => {
  const entries = [
    { date: '2026-01-01', value: 1000 },
    { date: '2026-01-02', value: 1100 },
    { date: '2026-01-05', value: 1700 },
  ];

  it('subtracts cumulative deposits made up to and including each date', () => {
    const deposits = [
      { date: '2026-01-01', amount: 1000 },
      { date: '2026-01-05', amount: 500 },
    ];
    expect(computeReturnLine(entries, deposits)).toEqual([0, 100, 200]);
  });

  it('counts deposits made before the first entry', () => {
    expect(computeReturnLine(entries, [{ date: '2025-12-01', amount: 900 }])).toEqual([100, 200, 800]);
  });

  it('handles unsorted deposits and a deposit on a non-trading day', () => {
    const deposits = [
      { date: '2026-01-03', amount: 500 },
      { date: '2026-01-01', amount: 1000 },
    ];
    expect(computeReturnLine(entries, deposits)).toEqual([0, 100, 200]);
  });

  it('returns the raw value when there are no deposits', () => {
    expect(computeReturnLine(entries, [])).toEqual([1000, 1100, 1700]);
  });
});
