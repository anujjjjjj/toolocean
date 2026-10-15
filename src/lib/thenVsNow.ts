/** CPI ratios compare purchasing power within one currency, never exchange rates. */
export function calculateThenVsNow(amount: number, year: number, series: {
  annual: Record<string, number>;
  latest: { year: number; value: number };
}) {
  const base = series.annual[String(year)];
  if (!Number.isFinite(amount) || amount < 0 || !Number.isInteger(year) || year < 1990 || year > 2025 || !base) {
    throw new Error("Enter a non-negative amount and a year from 1990 to 2025.");
  }
  const multiplier = series.latest.value / base;
  const value = amount * multiplier;
  if (!Number.isFinite(value)) throw new Error("Amount is too large.");
  const years = series.latest.year - year;
  return { value, multiplier, annualRate: years > 0 ? (Math.pow(multiplier, 1 / years) - 1) * 100 : null };
}

export function calculatePurchasingPower(amount: number, year: number, annual: Record<string, number>, latest: { year: number; value: number }) {
  try {
    const result = calculateThenVsNow(amount, year, { annual, latest });
    return { equivalent: result.value, multiplier: result.multiplier, annualInflation: result.annualRate };
  } catch { return null; }
}
