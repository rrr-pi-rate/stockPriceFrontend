import { generateFakePortfolio } from './fake-portfolio.generator';

describe('generateFakePortfolio', () => {
  const ref = new Date(2026, 5, 15);

  it('is deterministic for the same seed', () => {
    expect(generateFakePortfolio(ref)).toEqual(generateFakePortfolio(ref));
  });

  it('produces ascending weekday dates with positive values', () => {
    const points = generateFakePortfolio(ref);
    expect(points.length).toBeGreaterThan(400);
    for (let i = 1; i < points.length; i++) expect(points[i].date > points[i - 1].date).toBe(true);
    for (const p of points) {
      const day = new Date(p.date).getUTCDay();
      expect(day).not.toBe(0);
      expect(day).not.toBe(6);
      expect(p.value).toBeGreaterThan(0);
    }
  });
});
