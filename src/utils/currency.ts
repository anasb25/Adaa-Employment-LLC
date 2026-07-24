/** Format amount as AED with thousand separators (e.g. AED 154,763.90) */
export function formatAedAmount(
  value: number | null | undefined,
  fractionDigits = 2,
): string {
  return `AED ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

/** Hourly rate with AED prefix (e.g. AED 5.00/hr) */
export function formatAedRate(
  value: number | null | undefined,
  fractionDigits = 2,
): string {
  return `${formatAedAmount(value, fractionDigits)}/hr`;
}

/** Shorter AED label for chart axes (e.g. AED 155k) */
export function formatAedAxis(value: number): string {
  const amount = Number(value) || 0;
  if (amount >= 1_000_000) {
    return `AED ${(amount / 1_000_000).toLocaleString(undefined, {
      maximumFractionDigits: 1,
    })}M`;
  }
  if (amount >= 1_000) {
    return `AED ${(amount / 1_000).toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })}k`;
  }
  return formatAedAmount(amount, 0);
}
