import { ProductType } from '@unchainedshop/core-products';
import type { TicketingModule } from './module.ts';
import type { Bound, UnchainedCore } from '@unchainedshop/core';

interface DiscountOptions {
  generateDiscount?: boolean;
  countryCode?: string;
  currencyCode?: string;
}

async function cancelTicketsForProduct(
  this: TicketingModule & UnchainedCore['modules'],
  productId: string,
  options?: DiscountOptions,
): Promise<{
  cancelledCount: number;
}> {
  const tokensToCancel = await this.warehousing.findTokens({
    productId,
    'meta.cancelled': null,
  });

  for (const token of tokensToCancel) {
    await this.warehousing.invalidateToken(token._id);
    await this.passes.cancelTicket(token._id);
  }

  await this.products.update(productId, {
    'meta.cancelled': true,
  });

  const affectedUserIds = [...new Set(tokensToCancel.map((t) => t.userId).filter(Boolean))] as string[];

  const discountByUser = new Map<string, { discountCode: string; amount: number }>();

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
            acc[token.userId] = (acc[token.userId] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      for (const [userId, quantity] of Object.entries(userTokenCounts)) {
        const totalAmount = price.amount * quantity;
        const discountCode = await this.passes.generateDiscountCode(totalAmount);
        discountByUser.set(userId, { discountCode, amount: totalAmount });
      }
    }
  }

  await Promise.allSettled(
    affectedUserIds.map(async (userId) => {
      const discount = discountByUser.get(userId);
      await this.worker.addWork({
        type: 'MESSAGE',
        input: {
          template: 'EVENT_CANCELLED',
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
  this: TicketingModule & UnchainedCore['modules'],
  tokenId: string,
  options?: DiscountOptions,
): Promise<{ token: any }> {
  const token = await this.warehousing.findToken({ tokenId });
  await this.warehousing.invalidateToken(tokenId);
  const cancelledToken = await this.passes.cancelTicket(tokenId);

  let discountCode: string | undefined;
  let discountAmount: number | undefined;

  if (options?.generateDiscount && cancelledToken && options.countryCode) {
    const product = await this.products.findProduct({ productId: cancelledToken.productId });
    const price =
      product &&
      (await this.products.prices.price(product, {
        countryCode: options.countryCode,
        currencyCode: options.currencyCode,
      }));

    if (price?.amount) {
      discountAmount = price.amount;
      discountCode = await this.passes.generateDiscountCode(discountAmount);
    }
  }

  if (token?.userId) {
    await this.worker.addWork({
      type: 'MESSAGE',
      input: {
        template: 'TICKET_CANCELLED',
        tokenId,
        userId: token.userId,
        discountCode,
        discountAmount,
      },
    });
  }

  return { token: cancelledToken };
}

async function isPassCodeValid(
  this: TicketingModule & UnchainedCore['modules'],
  passCode: string,
  productId?: string,
): Promise<boolean> {
  if (!passCode) return false;

  const products = await this.products.findProducts({
    type: ProductType.TOKENIZED_PRODUCT,
    includeDrafts: false,
  });

  const matchingProducts = productId ? products.filter((p) => p._id === productId) : products;

  return matchingProducts
    .filter(Boolean)
    .some(
      (p) =>
        (p.meta as Record<string, any>)?.scannerPassCode?.toLowerCase().trim() ===
        passCode.toLowerCase().trim(),
    );
}

async function productIdsForPassCode(
  this: TicketingModule & UnchainedCore['modules'],
  passCode: string,
): Promise<string[]> {
  if (!passCode) return [];

  const products = await this.products.findProducts({
    type: ProductType.TOKENIZED_PRODUCT,
    includeDrafts: false,
  });

  return products
    .filter(
      (p) =>
        (p.meta as Record<string, any>)?.scannerPassCode?.toLowerCase().trim() ===
        passCode.toLowerCase().trim(),
    )
    .map((p) => p._id);
}

export default {
  ticketing: {
    cancelTicketsForProduct,
    cancelTicketWithDiscount,
    isPassCodeValid,
    productIdsForPassCode,
  },
};

export interface TicketingServices {
  ticketing: {
    cancelTicketsForProduct: Bound<typeof cancelTicketsForProduct>;
    cancelTicketWithDiscount: Bound<typeof cancelTicketWithDiscount>;
    isPassCodeValid: Bound<typeof isPassCodeValid>;
    productIdsForPassCode: Bound<typeof productIdsForPassCode>;
  };
}
