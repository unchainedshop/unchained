import type { UnchainedCore } from '@unchainedshop/core';
import { formatPrice, type Price } from '@unchainedshop/utils';

export interface OrderDisplayOptions {
  locale: Intl.Locale;
  useNetPrice?: boolean;
  format?: (price: Price) => string;
}

export async function getOrderPriceFormatter(
  currencyCode: string,
  locale: Intl.Locale | undefined,
  { modules }: UnchainedCore,
) {
  const currency = await modules.currencies.findCurrency({ isoCode: currencyCode });
  return (price: Price) =>
    formatPrice({ ...price, locale: locale ?? 'de-CH', decimals: currency?.decimals ?? 2 });
}
