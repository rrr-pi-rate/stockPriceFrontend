export type BenchmarkKind = 'msci' | 'sp500' | 'omxc25' | 'inflation' | 'bonds';

export const LIVE_BENCHMARKS: ReadonlySet<BenchmarkKind> = new Set(['msci', 'sp500', 'omxc25']);
export function isLiveBenchmark(kind: BenchmarkKind): boolean {
  return LIVE_BENCHMARKS.has(kind);
}
