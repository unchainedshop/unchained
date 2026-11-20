import type { MessageTemplateContext } from '@unchainedshop/core';
import { formatPrice, type Price } from '@unchainedshop/utils';

export interface OrderDisplayOptions {
  locale: Intl.Locale;
  useNetPrice?: boolean;
  format?: (price: Price) => string;
}

export async function getOrderPriceFormatter(
  currencyCode: string,
  options: OrderDisplayOptions,
  context: MessageTemplateContext,
) {
  if (options?.format) return options.format;
  const decimals = await context.getCurrencyDecimals?.(currencyCode);
  const locale = options?.locale ?? 'de-CH';
  return (price: Price) => formatPrice({ ...price, locale, decimals });
}
