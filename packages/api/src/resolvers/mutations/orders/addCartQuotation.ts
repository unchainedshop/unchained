import { log } from '@unchainedshop/logger';
import { QuotationStatus } from '@unchainedshop/core-quotations';
import type { Context } from '../../../context.ts';
import {
  QuotationNotFoundError,
  QuotationWrongStatusError,
  OrderQuantityTooLowError,
  InvalidIdError,
  OrderWrongStatusError,
  ProductNotFoundError,
  OrderNotFoundError,
  QuotationItemConfigurationError,
  QuotationInvalidError,
  OrderItemNotFoundError,
} from '../../../errors.ts';

export default async function addCartQuotation(
  root: never,
  params: {
    orderId?: string;
    quotationId: string;
    quantity?: number | null;
    configuration: { key: string; value: string }[];
  },
  context: Context,
) {
  const { modules, services, userId, user } = context;
  const { orderId, quotationId, quantity, configuration } = params;

  log(
    `mutation addCartQuotation ${quotationId} ${quantity} ${
      configuration ? JSON.stringify(configuration) : ''
    }`,
    { userId, orderId },
  );

  if (!quotationId) throw new InvalidIdError({ quotationId });

  if (quantity != null && quantity < 1) throw new OrderQuantityTooLowError({ quantity });

  const quotation = await modules.quotations.findQuotation({ quotationId });
  if (!quotation) throw new QuotationNotFoundError({ quotationId });
  // Checked before the cart is initialised, so a quotation that cannot be added creates no cart
  if (quotation.status !== QuotationStatus.PROPOSED) {
    throw new QuotationWrongStatusError({ status: quotation.status });
  }

  const order = await services.orders.findOrInitCart({
    orderId,
    user: user!,
    countryCode: context.countryCode,
  });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  // Ownership of cart and quotation is checked by the addCartQuotation ACL
  let position;
  try {
    position = await services.orders.addCartQuotation(
      { order, quotation, quantity, configuration },
      context,
    );
  } catch (error) {
    switch (error.name) {
      case 'QuotationWrongStatusError':
        throw new QuotationWrongStatusError({ status: quotation.status });
      case 'QuotationInvalidError':
        throw new QuotationInvalidError({ quotationId, orderId: order._id });
      case 'ProductNotFoundError':
        throw new ProductNotFoundError({ productId: quotation.productId });
      case 'QuotationItemConfigurationError':
        throw new QuotationItemConfigurationError({ configuration });
      case 'OrderItemNotFoundError':
        throw new OrderItemNotFoundError({});
      default:
        throw error;
    }
  }

  await services.orders.updateCalculation(order._id);
  return modules.orders.positions.findOrderPosition({ itemId: position._id });
}
