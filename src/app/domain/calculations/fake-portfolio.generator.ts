import { Deposit } from '../models/deposit.model';
import { PortfolioDataPoint } from '../models/portfolio-data-point.model';

const START_VALUE = 100_000;
const DAYS = 730;
const MONTHLY_DEPOSIT = 3_000;

// Small deterministic PRNG (mulberry32), so the demo data is stable between reloads.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Opening deposit of START_VALUE on the first day, then MONTHLY_DEPOSIT on the first trading day of each month. */
export function generateFakeDeposits(referenceDate: Date = new Date(), seed = 42): Deposit[] {
  return generateFake(referenceDate, seed).deposits;
}

export function generateFakePortfolio(
  referenceDate: Date = new Date(),
  seed = 42,
): PortfolioDataPoint[] {
  return generateFake(referenceDate, seed).points;
}

function generateFake(
  referenceDate: Date,
  seed: number,
): { points: PortfolioDataPoint[]; deposits: Deposit[] } {
  const random = mulberry32(seed);
  const points: PortfolioDataPoint[] = [];
  const deposits: Deposit[] = [];
  let value = START_VALUE;
  let lastMonth = -1;

  for (let i = DAYS; i >= 0; i--) {
    const d = new Date(
      Date.UTC(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate() - i),
    );
    const weekday = d.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    // Slight upward drift with ~1% daily noise.
    value *= 1 + 0.0004 + (random() - 0.5) * 0.02;
    const month = d.getUTCMonth();
    if (points.length === 0) {
      deposits.push({ date: isoDate(d), amount: START_VALUE });
    } else if (month !== lastMonth) {
      value += MONTHLY_DEPOSIT;
      deposits.push({ date: isoDate(d), amount: MONTHLY_DEPOSIT });
    }
    lastMonth = month;
    points.push({ date: isoDate(d), value: Math.round(value * 100) / 100 });
  }
  return { points, deposits };
}
