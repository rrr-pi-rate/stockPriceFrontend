import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  BenchmarkRateProviderPort,
  BenchmarkRates,
} from '../../../application/ports/outbound/benchmark-rate-provider.port';

const ANNUAL_RATES: BenchmarkRates = {
  msci: 0.1,
  sp500: 0.11,
  omxc25: 0.08,
  inflation: 0.025,
  bonds: 0.03,
};

@Injectable()
export class StaticBenchmarkRateAdapter extends BenchmarkRateProviderPort {
  override getAnnualRates(): Observable<BenchmarkRates> {
    return of(ANNUAL_RATES);
  }
}
