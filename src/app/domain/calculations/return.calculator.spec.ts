import {
  computePeriodReturn,
  computeReturnBenchmarkPercentLine,
  computeReturnLine,
  computeReturnPercentLine,
} from './return.calculator';

describe('computeReturnPercentLine', () => {
  const period = [
    { date: '2026-01-01', value: 1000 },
    { date: '2026-01-06', value: 1150 },
    { date: '2026-01-11', value: 1300 },
  ];

  it('equals the plain value change in % when there are no deposits', () => {
    const line = computeReturnPercentLine(
      [period[0], { date: '2026-01-02', value: 1100 }],
      [],
    );
    expect(line).toEqual([0, 10]);
  });

  it('subtracts deposits on their own date and weights them by time invested', () => {
    // 500 deposited before the period, 200 on the 6th (halfway).
    const deposits = [
      { date: '2025-12-01', amount: 500 },
      { date: '2026-01-06', amount: 200 },
    ];
    const line = computeReturnPercentLine(period, deposits);

    expect(line?.[0]).toBe(0);
    // the 6th: value +150 but 200 deposited => gain -50 on capital 1000 (deposit weight 0)
    expect(line?.[1]).toBeCloseTo(-5, 5);
    // the 11th: gain 100; capital 1000 + 200 * 0.5 = 1100
    expect(line?.[2]).toBeCloseTo((100 / 1100) * 100, 5);
  });

  it('ends on the same number as the period return card', () => {
    const deposits = [
      { date: '2025-12-01', amount: 500 },
      { date: '2026-01-06', amount: 200 },
    ];
    const line = computeReturnPercentLine(period, deposits);
    expect(line?.[line.length - 1]).toBeCloseTo(
      computePeriodReturn(period, deposits)?.percentage as number,
      10,
    );
  });

  it('is null without entries or without capital to relate the gain to', () => {
    expect(computeReturnPercentLine([], [])).toBeNull();
    expect(
      computeReturnPercentLine(
        [
          { date: '2026-01-01', value: 0 },
          { date: '2026-01-02', value: 50 },
        ],
        [],
      ),
    ).toBeNull();
  });
});

describe('computeReturnBenchmarkPercentLine', () => {
  const entries = [
    { date: '2026-01-01', value: 1000 },
    { date: '2026-01-02', value: 1100 },
    { date: '2026-01-03', value: 1300 },
  ];
  // 200 deposited on the last date: value 1300 = 1100 market value + 200.
  const deposits = [{ date: '2026-01-03', amount: 200 }];

  it('grows capital with the benchmark and adds later deposits at that day\'s level', () => {
    const line = computeReturnBenchmarkPercentLine(entries, deposits, [1000, 1050, 1102.5]);

    expect(line[0]).toBe(0);
    expect(line[1]).toBeCloseTo(5, 5); // 1000 grown 5 %
    // 1050 -> 1102.5, then +200 deposit (= 1302.5) against 1200 invested: gain 102.5 on capital 1000
    expect(line[2]).toBeCloseTo(10.25, 5);
  });

  it('weights a mid-period deposit like the portfolio line does', () => {
    const midEntries = [
      { date: '2026-01-01', value: 1000 },
      { date: '2026-01-02', value: 1300 },
      { date: '2026-01-03', value: 1400 },
    ];
    const mid = [{ date: '2026-01-02', amount: 200 }];
    const line = computeReturnBenchmarkPercentLine(midEntries, mid, [1000, 1000, 1100]);

    expect(line[1]).toBeCloseTo(0, 5);
    // 1200 invested grows 10 % to 1320: gain 120; capital 1000 + 200 * 0.5 = 1100
    expect(line[2]).toBeCloseTo((120 / 1100) * 100, 5);
  });

  it('stays at 0 % when the benchmark does not move, deposits or not', () => {
    expect(computeReturnBenchmarkPercentLine(entries, deposits, [1000, 1000, 1000])).toEqual([
      0, 0, 0,
    ]);
  });

  it('is null before the first benchmark point and starts at 0 % there', () => {
    const line = computeReturnBenchmarkPercentLine(entries, deposits, [null, 1000, 1100]);

    expect(line[0]).toBeNull();
    expect(line[1]).toBe(0);
    // 1100 grows 10 % to 1210, +200 = 1410 against 1300 invested: gain 110 on capital 1100
    expect(line[2]).toBeCloseTo(10, 5);
  });

  it('carries the last benchmark value over a gap', () => {
    const line = computeReturnBenchmarkPercentLine(entries, deposits, [1000, null, 1100]);
    expect(line[1]).toBeCloseTo(0, 5); // no growth over the gap
    expect(line[2]).toBeCloseTo(10, 5); // 1000 * 1.1 + 200 = 1300 against 1200: gain 100 on 1000
  });

  it('is all null when there is no benchmark data', () => {
    expect(computeReturnBenchmarkPercentLine(entries, deposits, [null, null, null])).toEqual([
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
