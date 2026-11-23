export const formatAmount = ({
  amount,
  currencyCode,
  decimals,
  locale,
  currencyDisplay,
}: {
  amount: number;
  currencyCode: string;
  decimals: number;
  locale?: Intl.Locale | string;
  currencyDisplay?: Intl.NumberFormatOptions['currencyDisplay'];
}) => {
  const value = amount / 10 ** decimals;
  const digits = { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
  try {
    return new Intl.NumberFormat(locale?.toString(), {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay,
      ...digits,
    }).format(value);
  } catch {
    return `${currencyCode} ${new Intl.NumberFormat(locale?.toString(), digits).format(value)}`;
  }
};
