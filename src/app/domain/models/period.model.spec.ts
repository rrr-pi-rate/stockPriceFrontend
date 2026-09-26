import { periodEquals } from './period.model';

describe('periodEquals', () => {
  it('treats two "all" periods as equal', () => {
    expect(periodEquals({ kind: 'all' }, { kind: 'all' })).toBe(true);
  });

  it('treats two "ytd" periods as equal', () => {
    expect(periodEquals({ kind: 'ytd' }, { kind: 'ytd' })).toBe(true);
  });

  it('compares trailing-days periods by their day count', () => {
    expect(periodEquals({ kind: 'trailing-days', days: 7 }, { kind: 'trailing-days', days: 7 })).toBe(
      true,
    );
    expect(periodEquals({ kind: 'trailing-days', days: 7 }, { kind: 'trailing-days', days: 30 })).toBe(
      false,
    );
  });

  it('treats periods of different kinds as unequal', () => {
    expect(periodEquals({ kind: 'all' }, { kind: 'ytd' })).toBe(false);
    expect(periodEquals({ kind: 'all' }, { kind: 'trailing-days', days: 7 })).toBe(false);
  });
});
