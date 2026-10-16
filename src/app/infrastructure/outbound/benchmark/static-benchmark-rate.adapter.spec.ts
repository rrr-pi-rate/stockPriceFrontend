import { firstValueFrom } from 'rxjs';
import { StaticBenchmarkRateAdapter } from './static-benchmark-rate.adapter';

describe('StaticBenchmarkRateAdapter', () => {
  it('returns the legacy hardcoded annual rates', async () => {
    const adapter = new StaticBenchmarkRateAdapter();
    const rates = await firstValueFrom(adapter.getAnnualRates());
    expect(rates).toEqual({
      msci: 0.1,
      sp500: 0.11,
      omxc25: 0.08,
      inflation: 0.025,
    });
  });
});
