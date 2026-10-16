import { computePeriodReturn, computeReturnLine } from './return.calculator';

describe('computePeriodReturn', () => {
  const period = [
    { date: '2026-01-01', value: 1000 },
    { date: '2026-01-06', value: 1150 },
    { date: '2026-01-11', value: 1300 },
  ];

  it('equals the plain value change when there are no deposits', () => {
    const result = computePeriodReturn([period[0], { date: '2026-01-11', value: 1100 }], []);
    expect(result?.absolute).toBeCloseTo(100, 5);
    expect(result?.percentage).toBeCloseTo(10, 5);
  });

  it('subtracts in-period deposits and weights them by time invested (Modified Dietz)', () => {
    // 500 deposited before the period, 200 halfway through (weight 0.5).
    const deposits = [
      { date: '2025-12-01', amount: 500 },
      { date: '2026-01-06', amount: 200 },
    ];
    const result = computePeriodReturn(period, deposits);
    // gain = (1300 - 700) - (1000 - 500) = 100; capital = 1000 + 200 * 0.5 = 1100
    expect(result?.absolute).toBeCloseTo(100, 5);
    expect(result?.percentage).toBeCloseTo((100 / 1100) * 100, 5);
  });

  it('shows a loss when a deposit is larger than the rise in value', () => {
    const result = computePeriodReturn(period, [{ date: '2026-01-11', amount: 500 }]);
    // value up 300, deposit 500 on the last day (weight 0) => gain -200 on capital 1000
    expect(result?.absolute).toBeCloseTo(-200, 5);
    expect(result?.percentage).toBeCloseTo(-20, 5);
  });

  it('treats a deposit on the first date as part of the start value, not in-period money', () => {
    const result = computePeriodReturn(period, [{ date: '2026-01-01', amount: 1000 }]);
    expect(result?.absolute).toBeCloseTo(300, 5);
    expect(result?.percentage).toBeCloseTo(30, 5);
  });

  it('is null with fewer than two entries or no capital to relate the gain to', () => {
    expect(computePeriodReturn([period[0]], [])).toBeNull();
    expect(
      computePeriodReturn(
        [
          { date: '2026-01-01', value: 0 },
          { date: '2026-01-02', value: 50 },
        ],
        [],
      ),
    ).toBeNull();
  });
});

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
