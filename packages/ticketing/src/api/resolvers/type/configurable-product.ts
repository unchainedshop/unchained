import type { Context } from '@unchainedshop/api';
import type { Product } from '@unchainedshop/core-products';
import { TicketEventProperty } from '../../../event-details.ts';
import { isTicketProduction } from '../../../production.ts';
import { readTicketSaleRules } from '../../../sale-rules.ts';
import { toSaleRulesOutput } from './tokenized-product.ts';

export const ConfigurableProduct = {
  // The ticketing values of a production are resolved from the product by the TicketProduction fields.
  ticketProduction(product: Product): Product | null {
    return isTicketProduction(product) ? product : null;
  },
};

const detail = (product: Product, key: string) => product.meta?.[key] ?? null;

export const TicketProduction = {
  location: (product: Product) => detail(product, TicketEventProperty.LOCATION),
  durationMinutes: (product: Product) => detail(product, TicketEventProperty.DURATION_MINUTES),
  doorsOpenMinutesBefore: (product: Product) =>
    detail(product, TicketEventProperty.DOORS_OPEN_MINUTES_BEFORE),
  saleRules: (product: Product) => toSaleRulesOutput(readTicketSaleRules(product.meta)),
  async categories(product: Product, _params: never, context: Context) {
    const variation = await context.modules.products.variations.findProductVariationByKey({
      productId: product._id,
      key: TicketEventProperty.CATEGORY,
    });
    const defaults = product.meta?.ticketCategories ?? {};
    return (variation?.options ?? []).map((code) => ({
      code,
      // The shape the core ProductVariationOption resolvers expect
      option: { _id: variation!._id, productVariationOption: code },
      capacity: defaults[code]?.capacity ?? null,
      pricing: defaults[code]?.pricing ?? [],
    }));
  },
};
