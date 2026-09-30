import type { UnchainedCore } from '@unchainedshop/core';
import {
  defaultValidateOrderPosition,
  type Order,
  type OrdersSettings,
} from '@unchainedshop/core-orders';
import { ProductType, type Product } from '@unchainedshop/core-products';
import { createLogger } from '@unchainedshop/logger';
import type { TicketingModule } from './module.ts';
import { isTicketEventCancelled } from './event-details.ts';
import { getDefaultTicketSaleRules, type TicketSaleRules } from './sale-rules.ts';
import {
  TicketEventCancelledError,
  TicketNotOnSaleError,
  TicketOrderLimitExceededError,
  TicketSaleEndedError,
  TicketSaleNotStartedError,
  TicketSoldOutError,
  TicketingModuleNotFoundError,
} from './api/errors.ts';

const logger = createLogger('unchained:ticketing');

export interface TicketSaleRulesInput {
  /** The ticket product being added or checked out (the variant, not the proxy). */
  product: Product;
  order: Order;
  /** How many tickets the cart change adds; 0 at checkout. */
  quantityDiff: number;
  /** The configurable product this ticket is a variant of, looked up on first use. */
  getProxy: () => Promise<Product | null>;
}

/**
 * The second argument of validateOrderPosition: the request context for cart mutations, only the
 * modules at checkout. Look up users through order.userId, not the request.
 */
export interface TicketValidationAPI {
  modules: UnchainedCore['modules'] & TicketingModule;
}

export type { TicketSaleRules };

export interface TicketOrderPositionValidatorOptions {
  /**
   * The sale rules of a ticket. Defaults to getDefaultTicketSaleRules (`meta.saleRules` of the
   * ticket and of its production); null switches the sale rules off.
   */
  getSaleRules?:
    | null
    | ((
        input: TicketSaleRulesInput,
        unchainedAPI: TicketValidationAPI,
      ) => TicketSaleRules | null | undefined | Promise<TicketSaleRules | null | undefined>);
}

const toDate = (value: Date | string) => (value instanceof Date ? value : new Date(value));

const isSet = <T>(value: T | null | undefined): value is T => value !== undefined && value !== null;

async function checkSaleRules(
  rules: TicketSaleRules,
  product: Product,
  quantityAfterChange: () => Promise<number>,
) {
  const productId = product._id;
  if (rules.onSale === false) throw new TicketNotOnSaleError({ productId });

  const now = Date.now();
  for (const [bound, value] of [
    ['salesStart', rules.salesStart],
    ['salesEnd', rules.salesEnd],
  ] as const) {
    if (!isSet(value) || value === '') continue;
    const date = toDate(value);
    if (Number.isNaN(date.getTime())) {
      // Selling early by mistake is worse than not selling: an unreadable date closes the sale.
      logger.warn(`Ticket sale rule ${bound} of product ${productId} is not a date`, { value });
      throw new TicketNotOnSaleError({ productId });
    }
    if (bound === 'salesStart' && now < date.getTime()) {
      throw new TicketSaleNotStartedError({ productId, salesStart: date });
    }
    if (bound === 'salesEnd' && now >= date.getTime()) {
      throw new TicketSaleEndedError({ productId, salesEnd: date });
    }
  }

  if (isSet(rules.maxPerOrder) && (await quantityAfterChange()) > rules.maxPerOrder) {
    throw new TicketOrderLimitExceededError({ productId, maxPerOrder: rules.maxPerOrder });
  }
}

/**
 * An `ordersSettings.validateOrderPosition` for ticket shops. It runs core's default check
 * (the product is active) first; for TOKENIZED_PRODUCT tickets it then refuses cancelled events,
 * applies the sale rules and keeps the sold tickets within `tokenization.supply`: issued tickets
 * that are not cancelled, PENDING orders and this order together. Without a supply there is no cap.
 * Reducing a quantity is always allowed. Concurrent checkouts can still oversell a little, because
 * tickets are only issued when an order is confirmed.
 */
export function createTicketOrderPositionValidator(
  options: TicketOrderPositionValidatorOptions = {},
): OrdersSettings['validateOrderPosition'] {
  const { getSaleRules = getDefaultTicketSaleRules } = options;

  return async (params, unchainedAPI) => {
    await defaultValidateOrderPosition(params, unchainedAPI);

    const { order, quantityDiff = 0 } = params;
    const product = params.product as Product | null | undefined;
    if (product?.type !== ProductType.TOKENIZED_PRODUCT) return;

    if (isTicketEventCancelled(product)) {
      throw new TicketEventCancelledError({ productId: product._id });
    }
    if (quantityDiff < 0) return;

    const api = unchainedAPI as TicketValidationAPI;
    const { modules } = api;

    // Tickets of this product the order already holds, loaded once and only when needed.
    let quantityInOrder: Promise<number> | undefined;
    const getQuantityInOrder = () =>
      (quantityInOrder ??= modules.orders.positions
        .findOrderPositions({ orderId: order._id })
        .then((positions) =>
          positions
            .filter(({ productId }) => productId === product._id)
            .reduce((sum, { quantity }) => sum + quantity, 0),
        ));

    if (getSaleRules) {
      let proxy: Promise<Product | null> | undefined;
      const rules = await getSaleRules(
        {
          product,
          order,
          quantityDiff,
          getProxy: () => (proxy ??= modules.products.firstActiveProductProxy(product._id)),
        },
        api,
      );
      if (rules) {
        await checkSaleRules(rules, product, async () => (await getQuantityInOrder()) + quantityDiff);
      }
    }

    const supply = product.tokenization?.supply;
    if (!supply || !(supply > 0)) return;
    if (!modules.passes?.countReservedTickets) throw new TicketingModuleNotFoundError({});

    const [reserved, inOrder] = await Promise.all([
      modules.passes.countReservedTickets({ productId: product._id, excludeOrderId: order._id }),
      getQuantityInOrder(),
    ]);
    if (reserved + inOrder + quantityDiff > supply) {
      throw new TicketSoldOutError({
        productId: product._id,
        available: Math.max(0, supply - reserved - inOrder),
      });
    }
  };
}

/** The ticket validator with the built-in sale rules (getDefaultTicketSaleRules). */
export const validateTicketOrderPosition = createTicketOrderPositionValidator();
