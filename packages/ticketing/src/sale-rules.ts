import type { Product } from '@unchainedshop/core-products';
import { TICKET_PRODUCTION_TAG } from './production.ts';

/** When and how many tickets of an event may be bought. Unset rules do not restrict the sale. */
export interface TicketSaleRules {
  /** false closes the sale, e.g. while the presale date is not known yet. */
  onSale?: boolean;
  /** Tickets can be bought from this moment on. */
  salesStart?: Date | string | null;
  /** Tickets can be bought until this moment. */
  salesEnd?: Date | string | null;
  /** The most tickets of this product one order may contain. */
  maxPerOrder?: number | null;
}

export const TICKET_SALE_RULE_KEYS = ['onSale', 'salesStart', 'salesEnd', 'maxPerOrder'] as const;

const isSet = (value: unknown) => value !== undefined && value !== null;

/** The sale rules stored in `meta.saleRules` of a performance, a standalone event or a production. */
export function readTicketSaleRules(meta?: Record<string, any> | null): TicketSaleRules {
  const stored = meta?.saleRules;
  if (!stored || typeof stored !== 'object') return {};
  return Object.fromEntries(
    TICKET_SALE_RULE_KEYS.filter((key) => isSet(stored[key])).map((key) => [key, stored[key]]),
  ) as TicketSaleRules;
}

/** The rules of a performance win over the defaults of its production; unset ones are inherited. */
export function mergeTicketSaleRules(
  production: TicketSaleRules,
  own: TicketSaleRules,
): TicketSaleRules {
  return { ...production, ...own };
}

/**
 * The built-in sale rules of a ticket: its own `meta.saleRules`, completed by the `meta.saleRules`
 * of its production. The production is only looked up while a rule is unset.
 */
export async function getDefaultTicketSaleRules({
  product,
  getProxy,
}: {
  product: Pick<Product, 'meta'>;
  getProxy: () => Promise<Pick<Product, 'tags' | 'meta'> | null>;
}): Promise<TicketSaleRules> {
  const own = readTicketSaleRules(product.meta);
  if (TICKET_SALE_RULE_KEYS.every((key) => key in own)) return own;
  const proxy = await getProxy();
  if (!proxy?.tags?.includes(TICKET_PRODUCTION_TAG)) return own;
  return mergeTicketSaleRules(readTicketSaleRules(proxy.meta), own);
}

export type UpdateTicketSaleRulesInput = {
  [key in keyof TicketSaleRules]?: TicketSaleRules[key] | null;
};

/**
 * The changed sale rules of an input, keyed by rule: omitted rules are left out, null clears one.
 * Dates are stored as dates so they compare like the event start. Returns null when a rule is
 * invalid.
 */
export function normalizeTicketSaleRulesInput(
  input?: UpdateTicketSaleRulesInput | null,
): Record<string, boolean | Date | number | null> | null {
  const changes: Record<string, boolean | Date | number | null> = {};
  for (const key of TICKET_SALE_RULE_KEYS) {
    const value = input?.[key];
    if (value === undefined) continue;
    if (value === null) {
      changes[key] = null;
    } else if (key === 'onSale') {
      if (typeof value !== 'boolean') return null;
      changes[key] = value;
    } else if (key === 'maxPerOrder') {
      if (!Number.isInteger(value) || (value as number) < 0) return null;
      changes[key] = value as number;
    } else {
      const date = value instanceof Date ? value : new Date(value as string);
      if (Number.isNaN(date.getTime())) return null;
      changes[key] = date;
    }
  }
  return changes;
}
