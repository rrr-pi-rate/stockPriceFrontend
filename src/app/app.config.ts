import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideKirby, withGlobalSetup } from '@kirbydesign/designsystem/config';
import { provideApi } from '@generated/api';
import { routes } from './app.routes';
import { BenchmarkRateProviderPort } from './application/ports/outbound/benchmark-rate-provider.port';
import { DashboardRepositoryPort } from './application/ports/outbound/dashboard-repository.port';
import { StaticBenchmarkRateAdapter } from './infrastructure/outbound/benchmark/static-benchmark-rate.adapter';
import { DashboardApiAdapter } from './infrastructure/outbound/dashboard/dashboard-api.adapter';
import { HttpBenchmarkLineAdapter } from './infrastructure/outbound/benchmark/http-benchmark-line.adapter';
import { BenchmarkLineProviderPort } from './application/ports/outbound/benchmark-line-provider.port';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    importProvidersFrom(BrowserModule, FormsModule),
    provideKirby(withGlobalSetup()),
    provideAnimations(),
    provideRouter(routes),
    provideHttpClient(),
    // Relative base path: the app calls "/dashboard/data" and relies on nginx (prod) or
    // proxy.conf.json (ng serve) to forward it to the real backend. See PROJECT.md, trin 5.
    provideApi(''),
    { provide: DashboardRepositoryPort, useClass: DashboardApiAdapter },
    { provide: BenchmarkRateProviderPort, useClass: StaticBenchmarkRateAdapter },
    { provide: BenchmarkLineProviderPort, useClass: HttpBenchmarkLineAdapter },
  ],
};
