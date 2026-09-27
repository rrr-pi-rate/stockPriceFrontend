import { Observable } from 'rxjs';
import { BenchmarkKind } from '../../../domain/models/benchmark.model';
import { BenchmarkPoint } from '../../../domain/models/benchmark-point.model';
import { Injectable } from '@angular/core';

@Injectable()
export abstract class BenchmarkLineProviderPort {
  abstract getBenchmarkLine(symbol: BenchmarkKind): Observable<BenchmarkPoint[]>;
}
