import type { UnchainedCore } from '@unchainedshop/core';
import { formatPrice, type Price } from '@unchainedshop/utils';

export interface OrderDisplayOptions {
  locale: Intl.Locale;
  useNetPrice?: boolean;
  format?: (price: Price) => string;
}

export async function getOrderPriceFormatter(
  currencyCode: string,
  options: OrderDisplayOptions,
  { modules }: UnchainedCore,
) {
  if (options?.format) return options.format;
  const currency = await modules.currencies.findCurrency({ isoCode: currencyCode });
  return (price: Price) =>
    formatPrice({ ...price, locale: options?.locale ?? 'de-CH', decimals: currency?.decimals ?? 2 });
}
