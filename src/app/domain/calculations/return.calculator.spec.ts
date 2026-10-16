import {
  computePeriodReturn,
  computeReturnBenchmarkLine,
  computeReturnLine,
} from './return.calculator';

describe('computeReturnBenchmarkLine', () => {
  const entries = [
    { date: '2026-01-01', value: 1000 },
    { date: '2026-01-02', value: 1100 },
    { date: '2026-01-03', value: 1300 },
  ];
  // 200 deposited on the last date: value 1300 = 1100 market value + 200.
  const returnLine = [1000, 1100, 1100];

  it('grows capital with the benchmark and adds later deposits against the same total deposited', () => {
    const line = computeReturnBenchmarkLine(entries, returnLine, [1000, 1050, 1102.5]);

    expect(line[0]).toBeCloseTo(1000, 5);
    expect(line[1]).toBeCloseTo(1050, 5); // 1000 grown 5 %
    expect(line[2]).toBeCloseTo(1102.5, 5); // 1050 -> 1102.5, then +200 deposit, against 1200 invested
  });

  it('stays flat at the starting return when the benchmark does not move, deposits or not', () => {
    const line = computeReturnBenchmarkLine(entries, returnLine, [1000, 1000, 1000]);
    expect(line).toEqual([1000, 1000, 1000]);
  });

  it('is null before the first benchmark point and starts level with the portfolio there', () => {
    const line = computeReturnBenchmarkLine(entries, returnLine, [null, 1000, 1100]);

    expect(line[0]).toBeNull();
    expect(line[1]).toBe(1100); // returnLine at the anchor
    // capital 1100 grows 10 % to 1210, +200 deposit = 1410, invested 1100 + 200 = 1300
    expect(line[2]).toBeCloseTo(1100 + (1410 - 1300), 5);
  });

  it('carries the last benchmark value over a gap', () => {
    const line = computeReturnBenchmarkLine(entries, returnLine, [1000, null, 1100]);
    // gap: no growth, no deposit => stays at 1000; then +10 % and the 200 deposit
    expect(line[1]).toBeCloseTo(1000, 5);
    expect(line[2]).toBeCloseTo(1000 + (1100 + 200 - 1200), 5);
  });

  it('is all null when there is no benchmark data', () => {
    expect(computeReturnBenchmarkLine(entries, returnLine, [null, null, null])).toEqual([
      null,
      null,
      null,
    ]);
  });
});

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
