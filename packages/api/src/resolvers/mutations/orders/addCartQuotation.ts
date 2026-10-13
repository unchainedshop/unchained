import { log } from '@unchainedshop/logger';
import { QuotationStatus } from '@unchainedshop/core-quotations';
import type { Context } from '../../../context.ts';
import {
  QuotationNotFoundError,
  QuotationWrongStatusError,
  OrderQuantityTooLowError,
  InvalidIdError,
  ProductNotFoundError,
  QuotationItemConfigurationError,
  QuotationInvalidError,
  OrderItemNotFoundError,
  rethrowAs,
} from '../../../errors.ts';
import loadCart from './loadCart.ts';

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
  const { modules, services, userId } = context;
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

  const order = await loadCart(context, orderId);

  // Ownership of cart and quotation is checked by the addCartQuotation ACL
  const position = await services.orders
    .addCartQuotation({ order, quotation, quantity, configuration }, context)
    .catch(
      rethrowAs({
        QuotationWrongStatusError,
        QuotationInvalidError,
        ProductNotFoundError,
        QuotationItemConfigurationError,
        OrderItemNotFoundError,
      }),
    );

  await services.orders.updateCalculation(order._id);
  return modules.orders.positions.findOrderPosition({ itemId: position._id });
}
