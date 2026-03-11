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
  discountCodes?: Array<{ userId: string; discountCode: string; amount: number }>;
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

  let discountCodes: Array<{ userId: string; discountCode: string; amount: number }> | undefined;

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

      discountCodes = [];
      for (const [userId, quantity] of Object.entries(userTokenCounts)) {
        const totalAmount = price.amount * quantity;
        const discountCode = await this.passes.generateDiscountCode(totalAmount);
        discountCodes.push({ userId, discountCode, amount: totalAmount });
      }
    }
  }

  return { cancelledCount: tokensToCancel.length, discountCodes };
}

async function cancelTicketWithDiscount(
  this: TicketingModule & UnchainedCore['modules'],
  tokenId: string,
  options?: DiscountOptions,
): Promise<{ token: any; discountCode?: string; amount?: number }> {
  await this.warehousing.invalidateToken(tokenId);
  const cancelledToken = await this.passes.cancelTicket(tokenId);

  let discountCode: string | undefined;
  let amount: number | undefined;

  if (options?.generateDiscount && cancelledToken && options.countryCode) {
    const product = await this.products.findProduct({ productId: cancelledToken.productId });
    const price =
      product &&
      (await this.products.prices.price(product, {
        countryCode: options.countryCode,
        currencyCode: options.currencyCode,
      }));

    if (price?.amount) {
      amount = price.amount;
      discountCode = await this.passes.generateDiscountCode(amount);
    }
  }

  return { token: cancelledToken, discountCode, amount };
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
