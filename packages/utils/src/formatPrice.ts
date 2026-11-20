/** Amounts are stored with at most nine decimal places, including currencies with a higher precision. */
export const getPriceDecimals = (decimals?: number | null) => Math.min(decimals ?? 2, 9);

/** Format a stored minor-unit amount. Without a configured scale, assume cents and use Intl's display precision. */
export function formatPrice({
  amount,
  currencyCode,
  locale,
  decimals,
}: {
  amount: number;
  currencyCode: string;
  locale: Intl.Locale | string;
  decimals?: number;
}) {
  const scale = getPriceDecimals(decimals);
  const majorAmount = amount / 10 ** scale;
  const displayDigits = Math.max(0, scale);
  const precision =
    decimals === undefined
      ? {}
      : { minimumFractionDigits: displayDigits, maximumFractionDigits: displayDigits };
  try {
    if (decimals !== undefined && !/^[a-z]{3}$/i.test(currencyCode)) {
      return `${currencyCode} ${majorAmount.toLocaleString(locale, precision)}`;
    }
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'code',
      ...precision,
    }).format(majorAmount);
  } catch {
    return `${currencyCode} ${majorAmount}`;
  }
}
