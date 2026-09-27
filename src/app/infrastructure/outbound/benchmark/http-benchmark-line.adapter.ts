import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { DashboardService } from '@generated/api';
import { BenchmarkLineProviderPort } from '../../../application/ports/outbound/benchmark-line-provider.port';
import { BenchmarkKind } from '../../../domain/models/benchmark.model';
import { BenchmarkPoint } from '../../../domain/models/benchmark-point.model';

const YAHOO_SYMBOLS: Readonly<Record<'msci' | 'sp500' | 'omxc25', string>> = {
  msci: 'URTH',
  sp500: '^GSPC',
  omxc25: '^OMXC25',
};

@Injectable()
export class HttpBenchmarkLineAdapter extends BenchmarkLineProviderPort {
  private readonly dashboardService = inject(DashboardService);
  private readonly cache = new Map<BenchmarkKind, Observable<BenchmarkPoint[]>>();

  override getBenchmarkLine(symbol: BenchmarkKind): Observable<BenchmarkPoint[]> {
    const cached = this.cache.get(symbol);
    if (cached) return cached;

    const yahooSymbol = YAHOO_SYMBOLS[symbol as keyof typeof YAHOO_SYMBOLS];
    if (!yahooSymbol) {
      throw new Error(`No Yahoo symbol mapping for benchmark "${symbol}"`);
    }

    const request$ = this.dashboardService.dashboardBenchmarkGet(yahooSymbol).pipe(
      map((dtos) => dtos.map((dto) => ({ date: dto.date, value: dto.value }))),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.cache.set(symbol, request$);
    return request$;
  }
}
