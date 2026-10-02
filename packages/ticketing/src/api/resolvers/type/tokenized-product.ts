import type { Context } from '@unchainedshop/api';
import type { Product } from '@unchainedshop/core-products';
import { getTicketEventDetails, isTicketEventCancelled } from '../../../event-details.ts';
import { findTicketCategoryTitle } from '../../../ticket-details.ts';
import {
  getDefaultTicketSaleRules,
  readTicketSaleRules,
  type TicketSaleRules,
} from '../../../sale-rules.ts';

const toDate = (value: unknown) => {
  if (!(value instanceof Date) && typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// The DateTime scalar cannot serialize unparsable dates, they are returned as null.
export const toSaleRulesOutput = ({ onSale, salesStart, salesEnd, maxPerOrder }: TicketSaleRules) => ({
  onSale: onSale ?? null,
  salesStart: toDate(salesStart),
  salesEnd: toDate(salesEnd),
  maxPerOrder: maxPerOrder ?? null,
});

const proxiesByRequest = new WeakMap<Context, Map<string, Promise<Product | null>>>();

// Loads the production of a performance once per request.
const getProxyOnce = (product: Product, context: Context) => {
  if (!proxiesByRequest.has(context)) proxiesByRequest.set(context, new Map());
  const proxies = proxiesByRequest.get(context)!;
  if (!proxies.has(product._id)) {
    proxies.set(product._id, context.modules.products.firstActiveProductProxy(product._id));
  }
  return proxies.get(product._id)!;
};

export const TokenizedProduct = {
  // The ticketing values of the event are resolved from the product by the TicketEvent fields.
  event(product: Product): Product {
    return product;
  },
};

// getTicketEventDetails only returns valid dates, which the DateTime scalar can serialize.
export const TicketEvent = {
  startsAt: (product: Product) => getTicketEventDetails(product).startsAt ?? null,
  endsAt: (product: Product) => getTicketEventDetails(product).endsAt ?? null,
  doorsOpenAt: (product: Product) => getTicketEventDetails(product).doorsOpenAt ?? null,
  location: (product: Product) => getTicketEventDetails(product).location ?? null,
  durationMinutes: (product: Product) => getTicketEventDetails(product).durationMinutes ?? null,
  doorsOpenMinutesBefore: (product: Product) =>
    getTicketEventDetails(product).doorsOpenMinutesBefore ?? null,
  category: (product: Product) => getTicketEventDetails(product).category ?? null,
  async categoryTitle(product: Product, { forceLocale }: { forceLocale?: string }, context: Context) {
    const title = await findTicketCategoryTitle(product, context, {
      locale: forceLocale ? new Intl.Locale(forceLocale) : context.locale,
      getProxy: () => getProxyOnce(product, context),
    });
    return title ?? null;
  },
  isCanceled: (product: Product) => isTicketEventCancelled(product),
  cancelledDate: (product: Product) =>
    isTicketEventCancelled(product) ? toDate(product.meta?.cancelledDate) : null,
  ownSaleRules: (product: Product) => toSaleRulesOutput(readTicketSaleRules(product.meta)),
  async saleRules(product: Product, _params: never, context: Context) {
    const rules = await getDefaultTicketSaleRules({
      product,
      getProxy: () => getProxyOnce(product, context),
    });
    return toSaleRulesOutput(rules);
  },
  overridden: (product: Product): string[] =>
    Array.isArray(product.meta?.overridden) ? product.meta.overridden : [],
};
