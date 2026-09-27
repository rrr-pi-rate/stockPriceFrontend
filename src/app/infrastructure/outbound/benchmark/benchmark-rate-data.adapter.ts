import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BenchmarkRateProviderPort,
  BenchmarkRates,
} from '../../../application/ports/outbound/benchmark-rate-provider.port';

@Injectable()
export class HttpBenchmarkRateAdapter extends BenchmarkRateProviderPort {
  private readonly http = inject(HttpClient);

  override getAnnualRates(): Observable<BenchmarkRates> {
    return this.http.get<BenchmarkRates>('/api/benchmark-rates');
  }
}
