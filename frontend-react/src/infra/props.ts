export function withDefault<T>(value: T | undefined, fallback: T): T {
  return value === undefined ? fallback : value;
}

export function fallthrough<T extends object>(input: T, consumed: readonly string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([key]) => !consumed.includes(key)));
}
