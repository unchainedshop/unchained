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

  const affectedUserIds = [...new Set(tokensToCancel.map((t) => t.userId).filter(Boolean))] as string[];

  const discountByUser = new Map<string, { discountCode: string; amount: number }>();

  // Issue credit before touching any ticket: a missing signing secret must not leave
  // tickets cancelled without the requested compensation.
  if (options?.generateDiscount && tokensToCancel.length > 0 && options.countryCode) {
    const product = await this.products.findProduct({ productId });
    const price =
      product &&
      (await this.products.prices.price(product, {
        countryCode: options.countryCode,
        currencyCode: options.currencyCode,
      }));

    if (price?.amount) {
      const userTokenCounts = tokensToCancel.reduce(
        (acc, token) => {
          if (token.userId) {
            acc[token.userId] = (acc[token.userId] || 0) + token.quantity;
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      for (const [userId, quantity] of Object.entries(userTokenCounts)) {
        const totalAmount = price.amount * quantity;
        const discountCode = await passes.generateDiscountCode(totalAmount, price.currencyCode);
        discountByUser.set(userId, { discountCode, amount: totalAmount });
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
    affectedUserIds.map(async (userId) => {
      const discount = discountByUser.get(userId);
      await this.worker.addWork({
        type: 'MESSAGE',
        input: {
          template: TicketingMessageTypes.EVENT_CANCELLED,
          productId,
          userId,
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

  if (token.userId) {
    await this.worker.addWork({
      type: 'MESSAGE',
      input: {
        template: TicketingMessageTypes.TICKET_CANCELLED,
        tokenId,
        userId: token.userId,
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
