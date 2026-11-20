import { formatPrice, type Price } from '@unchainedshop/utils';

export interface OrderDisplayOptions {
  locale: Intl.Locale;
  decimals?: number;
  useNetPrice?: boolean;
  format?: (price: Price) => string;
}

export function getOrderPriceFormatter(options: OrderDisplayOptions) {
  const { locale = 'de-CH', decimals, format } = options ?? {};
  return format ?? ((price: Price) => formatPrice({ ...price, locale, decimals }));
}
