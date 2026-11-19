import type { TicketingModule } from './module.ts';
import type { Bound, UnchainedCore } from '@unchainedshop/core';
import { ProductStatus } from '@unchainedshop/core-products';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';
import { isTicketCancelled, isTicketEventCancelled } from './event-details.ts';
import { findTicketIssuerSettings, generateTicketId } from './warehousing/ticket/adapter.ts';
import { TicketingMessageTypes } from './templates/index.ts';
import { TicketingEventTypes, emitTicketingEvent } from './events.ts';
import productionServices, { type TicketProductionServices } from './production-services.ts';

type Modules = UnchainedCore['modules'];
type TicketingModules = Modules & TicketingModule;

export interface DiscountOptions {
  generateDiscount?: boolean;
  countryCode?: string;
  currencyCode?: string;
}

export interface CancelTicketOptions extends DiscountOptions {
  /**
   * Refuse a redeemed ticket instead of cancelling it, also when a scan redeems it while the
   * cancellation runs: throws an Error with cause `TICKET_ALREADY_REDEEMED`.
   */
  refuseRedeemed?: boolean;
}

const purchaseOf = (token: TokenSurrogate) => ({
  orderId: typeof token.meta?.orderId === 'string' ? token.meta.orderId : undefined,
  userId: token.userId || undefined,
});

const alreadyRedeemed = (tokenId: string) =>
  new Error(`Ticket ${tokenId} has already been redeemed`, { cause: 'TICKET_ALREADY_REDEEMED' });

// The cancellation is written first, so TOKEN_INVALIDATED and the Apple pass it re-renders already
// see a cancelled ticket. Tickets redeemed earlier are not invalidated again and keep their date.
// With onlyValid nothing happens (null) unless the ticket is still valid when the cancel is written.
async function cancelAndInvalidateTicket(
  modules: Modules,
  tokenId: string,
  { onlyValid, meta }: { onlyValid?: boolean; meta?: Record<string, unknown> } = {},
): Promise<TokenSurrogate | null> {
  const { passes } = modules as TicketingModules;
  const cancelledToken = await passes.cancelTicket(tokenId, { onlyValid, meta });
  if (!cancelledToken && onlyValid) return null;
  const invalidatedToken = await modules.warehousing.invalidateToken(tokenId);
  return invalidatedToken || cancelledToken;
}

async function cancelTicketsForProduct(
  this: Modules,
  productId: string,
  options?: DiscountOptions,
): Promise<{
  cancelledCount: number;
}> {
  const { passes } = this as unknown as TicketingModules;
  const tokensToCancel = await this.warehousing.findTokens({
    productId,
    'meta.cancelled': null,
  });

  const purchases = new Map<
    string,
    {
      orderId?: string;
      userId?: string;
      quantity: number;
      discount?: { discountCode: string; amount: number };
    }
  >();
  for (const token of tokensToCancel) {
    const { orderId, userId } = purchaseOf(token);
    if (!orderId && !userId) continue;
    const key = orderId ? `order:${orderId}` : `user:${userId}`;
    const purchase = purchases.get(key) ?? { orderId, userId, quantity: 0 };
    purchase.quantity += token.quantity;
    purchases.set(key, purchase);
  }

  // Issue credit before touching any ticket: a missing signing secret must not leave
  // tickets cancelled without the requested compensation.
  if (options?.generateDiscount && purchases.size > 0 && options.countryCode) {
    const product = await this.products.findProduct({ productId });
    const price =
      product &&
      (await this.products.prices.price(product, {
        countryCode: options.countryCode,
        currencyCode: options.currencyCode,
      }));

    if (price?.amount) {
      for (const purchase of purchases.values()) {
        const amount = price.amount * purchase.quantity;
        const discountCode = await passes.generateDiscountCode(amount, price.currencyCode);
        purchase.discount = { discountCode, amount };
      }
    }
  }

  for (const token of tokensToCancel) {
    const cancelledToken = await cancelAndInvalidateTicket(this, token._id);
    await emitTicketingEvent(TicketingEventTypes.TICKET_CANCELLED, {
      token: cancelledToken || token,
    });
  }

  await this.products.update(productId, {
    'meta.cancelled': true,
    'meta.cancelledDate': new Date(),
  });

  await emitTicketingEvent(TicketingEventTypes.TICKET_EVENT_CANCELLED, {
    productId,
    cancelledCount: tokensToCancel.length,
  });

  await Promise.allSettled(
    [...purchases.values()].map(async ({ orderId, userId, discount }) => {
      await this.worker.addWork({
        type: 'MESSAGE',
        input: {
          template: TicketingMessageTypes.EVENT_CANCELLED,
          productId,
          userId,
          orderId,
          discountCode: discount?.discountCode,
          discountAmount: discount?.amount,
        },
      });
    }),
  );

  return { cancelledCount: tokensToCancel.length };
}

async function cancelTicketWithDiscount(
  this: Modules,
  tokenId: string,
  options?: CancelTicketOptions,
): Promise<{ token: any }> {
  const { passes } = this as unknown as TicketingModules;
  const token = await this.warehousing.findToken({ tokenId });
  if (!token || token.meta?.cancelled) return { token };
  if (options?.refuseRedeemed && token.invalidatedDate) throw alreadyRedeemed(tokenId);

  let discountCode: string | undefined;
  let discountAmount: number | undefined;

  if (options?.generateDiscount && options.countryCode) {
    const product = await this.products.findProduct({ productId: token.productId });
    const price =
      product &&
      (await this.products.prices.price(product, {
        countryCode: options.countryCode,
        currencyCode: options.currencyCode,
      }));

    if (price?.amount) {
      discountAmount = price.amount * token.quantity;
      discountCode = await passes.generateDiscountCode(discountAmount, price.currencyCode);
    }
  }

  const cancelledToken = await cancelAndInvalidateTicket(this, tokenId, {
    onlyValid: options?.refuseRedeemed,
  });
  if (!cancelledToken && options?.refuseRedeemed) {
    // A scan or another cancellation got there after the read above. The code issued for this
    // attempt is dropped unsent, so the ticket is reimbursed at most once and never after entry.
    const current = await this.warehousing.findToken({ tokenId });
    if (!current || current.meta?.cancelled) return { token: current };
    throw alreadyRedeemed(tokenId);
  }
  await emitTicketingEvent(TicketingEventTypes.TICKET_CANCELLED, {
    token: cancelledToken || token,
  });

  const { orderId, userId } = purchaseOf(token);
  if (orderId || userId) {
    await this.worker.addWork({
      type: 'MESSAGE',
      input: {
        template: TicketingMessageTypes.TICKET_CANCELLED,
        tokenId,
        userId,
        orderId,
        discountCode,
        discountAmount,
      },
    });
  }

  return { token: cancelledToken };
}

const exchangeRefused = (message: string) => new Error(message, { cause: 'TICKET_EXCHANGE_INVALID' });

const EXCHANGE_CLEARED_META = ['cancelled', 'cancelledDate', 'exchangedTo'];

/**
 * Moves tickets to another date of the same production, all or none: under the supply lock of
 * that date each ticket is cancelled first and replaced by one with the same purchase, owner and
 * project metadata. A retry creates the replacements a failed run left out and moves nothing twice.
 * No credit, no message: subscribe to TICKET_EXCHANGED to tell the buyer.
 */
async function exchangeTickets(
  this: Modules,
  { tokenIds, productId }: { tokenIds: string[]; productId: string },
): Promise<TokenSurrogate[]> {
  const { passes } = this as TicketingModules;
  const target = await this.products.findProduct({ productId });
  const production = await this.products.firstActiveProductProxy(productId);
  if (target?.status !== ProductStatus.ACTIVE || !production || isTicketEventCancelled(target)) {
    throw exchangeRefused(`Event ${productId} does not take exchanged tickets`);
  }
  const tokens = await this.warehousing.findTokens({ _id: { $in: tokenIds } });
  if (tokens.length !== new Set(tokenIds).size) {
    throw new Error('Ticket not found', { cause: 'TICKET_NOT_FOUND' });
  }

  await using supplyLocks = await this.orders.lockSupply([productId]);
  const toMove: TokenSurrogate[] = [];
  const toReplace: TokenSurrogate[] = [];
  for (const token of tokens) {
    if (token.meta?.exchangedTo) {
      if (!(await this.warehousing.findToken({ tokenId: token.meta.exchangedTo }))) {
        toReplace.push(token);
      }
      continue;
    }
    const source = await this.products.firstActiveProductProxy(token.productId);
    if (token.productId === productId || source?._id !== production._id) {
      throw exchangeRefused(`Ticket ${token._id} is not for another date of the production`);
    }
    if (!token.userId || token.walletAddress) {
      throw exchangeRefused(`Ticket ${token._id} has been exported to a wallet`);
    }
    if (token.invalidatedDate || isTicketCancelled(token)) throw alreadyRedeemed(token._id);
    toMove.push(token);
  }
  const supply = target.tokenization?.supply;
  const seats = [...toMove, ...toReplace].reduce((sum, { quantity }) => sum + quantity, 0);
  if (supply && supply > 0 && (await passes.countReservedTickets({ productId })) + seats > supply) {
    throw new Error(`Not enough tickets left for event ${productId}`, { cause: 'TICKET_SOLD_OUT' });
  }

  for (const token of toMove) {
    const exchangedTo = generateTicketId();
    const cancelled = await cancelAndInvalidateTicket(this, token._id, {
      onlyValid: true,
      meta: { exchangedTo },
    });
    if (!cancelled) throw alreadyRedeemed(token._id);
    await emitTicketingEvent(TicketingEventTypes.TICKET_CANCELLED, { token: cancelled });
    toReplace.push(cancelled);
  }

  const offset = (await findTicketIssuerSettings(this))?.serialOffset ?? 0;
  for (const token of toReplace) {
    const exchangedTo = token.meta?.exchangedTo;
    const meta = Object.fromEntries(
      Object.entries(token.meta ?? {}).filter(([key]) => !EXCHANGE_CLEARED_META.includes(key)),
    );
    const [tokenSerialNumber] = await passes.reserveTicketSerials(productId, 1, { offset });
    await this.warehousing.createTokens([
      {
        _id: exchangedTo,
        userId: token.userId,
        productId,
        orderPositionId: token.orderPositionId,
        quantity: token.quantity,
        tokenSerialNumber,
        meta: { ...meta, exchangedFrom: token._id },
      },
    ]);
    await emitTicketingEvent(TicketingEventTypes.TICKET_EXCHANGED, {
      tokenId: token._id,
      newTokenId: exchangedTo,
      fromProductId: token.productId,
      toProductId: productId,
    });
  }

  const replacementIds = (await this.warehousing.findTokens({ _id: { $in: tokenIds } })).map(
    ({ meta }) => meta?.exchangedTo,
  );
  return this.warehousing.findTokens({ _id: { $in: replacementIds } });
}

export default {
  ticketing: {
    cancelTicketsForProduct,
    cancelTicketWithDiscount,
    exchangeTickets,
    ...productionServices.ticketing,
  },
};

export interface TicketingServices {
  ticketing: TicketProductionServices['ticketing'] & {
    cancelTicketsForProduct: Bound<typeof cancelTicketsForProduct>;
    cancelTicketWithDiscount: Bound<typeof cancelTicketWithDiscount>;
    exchangeTickets: Bound<typeof exchangeTickets>;
  };
}
