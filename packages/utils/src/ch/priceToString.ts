import { formatPrice, type Price } from '../formatPrice.ts';

type SwissPrice = Price & { locale?: Intl.Locale | string };

export const priceToString = ({ amount, currencyCode, locale = 'de-CH' }: SwissPrice) =>
  formatPrice({ amount, currencyCode, locale });

export default priceToString;
