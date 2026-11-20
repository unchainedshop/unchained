export interface Price {
  amount: number;
  currencyCode: string;
}

/** Amounts are stored with at most nine decimal places, including currencies with a higher precision. */
export const getPriceDecimals = (decimals?: number | null) => Math.min(decimals ?? 2, 9);

type LocalizedPrice = Price & { locale: Intl.Locale | string; decimals?: number | null };

/** Format a stored minor-unit amount. Without a configured scale, assume cents and use Intl's display precision. */
export function formatPrice({ amount, currencyCode, locale, decimals }: LocalizedPrice) {
  const scale = getPriceDecimals(decimals);
  const majorAmount = amount / 10 ** scale;
  const digits = decimals == null ? undefined : Math.max(0, scale);
  const precision = { minimumFractionDigits: digits, maximumFractionDigits: digits };
  try {
    if (decimals != null && !/^[a-z]{3}$/i.test(currencyCode)) {
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
