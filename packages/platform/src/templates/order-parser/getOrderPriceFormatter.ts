import type { Order } from '@unchainedshop/core-orders';
import { formatPrice, type Price } from '@unchainedshop/utils';

export interface OrderDisplayOptions {
  locale: Intl.Locale;
  useNetPrice?: boolean;
  format?: (price: Price) => string;
}

export function getOrderPriceFormatter({ currencyDecimals }: Order, options: OrderDisplayOptions) {
  const locale = options?.locale ?? 'de-CH';
  return (
    options?.format ?? ((price: Price) => formatPrice({ ...price, locale, decimals: currencyDecimals }))
  );
}
