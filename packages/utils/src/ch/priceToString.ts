export const priceToString = ({
  amount,
  currencyCode,
  locale = 'de-CH',
}: {
  amount: number;
  currencyCode: string;
  locale?: Intl.Locale | string;
}) => {
  const majorUnitAmount = amount / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'code',
    }).format(majorUnitAmount);
  } catch {
    // Non-ISO currency codes (custom tokens etc.) make Intl.NumberFormat throw
    return `${currencyCode} ${majorUnitAmount}`;
  }
};

export default priceToString;
