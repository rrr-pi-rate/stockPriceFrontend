import { PortfolioDataPoint } from '../models/portfolio-data-point.model';

const START_VALUE = 100_000;
const DAYS = 730;

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

export function generateFakePortfolio(
  referenceDate: Date = new Date(),
  seed = 42,
): PortfolioDataPoint[] {
  const random = mulberry32(seed);
  const points: PortfolioDataPoint[] = [];
  let value = START_VALUE;

  for (let i = DAYS; i >= 0; i--) {
    const d = new Date(
      Date.UTC(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate() - i),
    );
    const weekday = d.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    // Slight upward drift with ~1% daily noise.
    value *= 1 + 0.0004 + (random() - 0.5) * 0.02;
    points.push({ date: isoDate(d), value: Math.round(value * 100) / 100 });
  }
  return points;
}
