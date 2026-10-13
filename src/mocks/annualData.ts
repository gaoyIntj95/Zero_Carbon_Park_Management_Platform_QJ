/** Each demo year starts from an independent snapshot of the original master data, never from another year’s edits. */
export const DATA_YEARS = [2026, 2025, 2024, 2023, 2022];
export const DEFAULT_DATA_YEAR = 2026;

export function createAnnualStore<T>(seed: T[]) {
  const years = new Map<number, T[]>();
  return {
    get(year = DEFAULT_DATA_YEAR) {
      if (!years.has(year)) years.set(year, structuredClone(seed));
      return years.get(year)!;
    },
    reset() { years.clear(); },
  };
}


