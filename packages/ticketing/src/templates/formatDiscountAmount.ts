import type { UnchainedCore } from '@unchainedshop/core';
import { formatPrice } from '@unchainedshop/utils';

export async function formatDiscountAmount(
  amount: number,
  currencyCode: string | undefined,
  locale: Intl.Locale,
  modules: UnchainedCore['modules'],
) {
  // Older queued messages omit the credit's currency, which can differ from the purchase currency.
  if (!currencyCode) return (amount / 100).toFixed(2);
  const currency = await modules.currencies.findCurrency({ isoCode: currencyCode });
  return formatPrice({ amount, currencyCode, locale, decimals: currency?.decimals ?? 2 });
}
