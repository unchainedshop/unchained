import type { TicketingModule } from './module.ts';
import type { Bound, UnchainedCore } from '@unchainedshop/core';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';
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
  { onlyValid }: { onlyValid?: boolean } = {},
): Promise<TokenSurrogate | null> {
  const { passes } = modules as TicketingModules;
  const cancelledToken = await passes.cancelTicket(tokenId, { onlyValid });
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

export default {
  ticketing: {
    cancelTicketsForProduct,
    cancelTicketWithDiscount,
    ...productionServices.ticketing,
  },
};

export interface TicketingServices {
  ticketing: TicketProductionServices['ticketing'] & {
    cancelTicketsForProduct: Bound<typeof cancelTicketsForProduct>;
    cancelTicketWithDiscount: Bound<typeof cancelTicketWithDiscount>;
  };
}
