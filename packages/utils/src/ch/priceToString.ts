import { formatPrice } from '../formatPrice.ts';

export const priceToString = ({
  amount,
  currencyCode,
  locale = 'de-CH',
}: {
  amount: number;
  currencyCode: string;
  locale?: Intl.Locale | string;
}) => formatPrice({ amount, currencyCode, locale });

export default priceToString;
