import { formatAmount } from '../format-amount.ts';

export const priceToString = ({
  amount,
  currencyCode,
  decimals = 2,
  locale = 'de-CH',
}: {
  amount: number;
  currencyCode: string;
  decimals?: number;
  locale?: Intl.Locale | string;
}) => formatAmount({ amount, currencyCode, decimals, locale, currencyDisplay: 'code' });

export default priceToString;
