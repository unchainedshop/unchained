import type { TicketingModule } from './module.ts';
import type { Bound, UnchainedCore } from '@unchainedshop/core';
import { TicketingMessageTypes } from './templates/index.ts';

type Modules = UnchainedCore['modules'];
type TicketingModules = Modules & TicketingModule;

interface DiscountOptions {
  generateDiscount?: boolean;
  countryCode?: string;
  currencyCode?: string;
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
    await this.warehousing.invalidateToken(token._id);
    await passes.cancelTicket(token._id);
  }

  await this.products.update(productId, {
    'meta.cancelled': true,
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
  options?: DiscountOptions,
): Promise<{ token: any }> {
  const { passes } = this as unknown as TicketingModules;
  const token = await this.warehousing.findToken({ tokenId });
  if (!token || token.meta?.cancelled) return { token };

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

  await this.warehousing.invalidateToken(tokenId);
  const cancelledToken = await passes.cancelTicket(tokenId);

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
  },
};

export interface TicketingServices {
  ticketing: {
    cancelTicketsForProduct: Bound<typeof cancelTicketsForProduct>;
    cancelTicketWithDiscount: Bound<typeof cancelTicketWithDiscount>;
  };
}
