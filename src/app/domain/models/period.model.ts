export type Period =
  | { readonly kind: 'all' }
  | { readonly kind: 'ytd' }
  | { readonly kind: 'trailing-days'; readonly days: number };

export function periodEquals(a: Period, b: Period): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'trailing-days' && b.kind === 'trailing-days') return a.days === b.days;
  return true;
}
