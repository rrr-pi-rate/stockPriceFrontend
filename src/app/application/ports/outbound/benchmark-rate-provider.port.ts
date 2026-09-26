import { Observable } from 'rxjs';
import { BenchmarkKind } from '../../../domain/models/benchmark.model';

export type BenchmarkRates = Readonly<Record<BenchmarkKind, number>>;

/**
 * Where the annual benchmark rates come from is deliberately hidden behind this port.
 * Today it's a hardcoded table (StaticBenchmarkRateAdapter); swapping to a fetched/external
 * source later only means adding a new adapter — domain and presentation never change.
 */
export abstract class BenchmarkRateProviderPort {
  abstract getAnnualRates(): Observable<BenchmarkRates>;
}
