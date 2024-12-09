import { log } from '@unchainedshop/logger';
import { QuotationStatus } from '@unchainedshop/core-quotations';
import { Context } from '../../../context.js';
import {
  QuotationNotFoundError,
  QuotationWrongStatusError,
  OrderQuantityTooLowError,
  InvalidIdError,
  OrderWrongStatusError,
  ProductNotFoundError,
} from '../../../errors.js';
import { getOrderCart } from '../utils/getOrderCart.js';

export default async function addCartQuotation(
  root: never,
  params: {
    orderId?: string;
    quotationId: string;
    quantity: number;
    configuration: Array<{ key: string; value: string }>;
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

  if (quantity < 1) throw new OrderQuantityTooLowError({ quantity });

  const quotation = await modules.quotations.findQuotation({ quotationId });
  if (!quotation) throw new QuotationNotFoundError({ quotationId });

  if (quotation.status !== QuotationStatus.PROPOSED) {
    throw new QuotationWrongStatusError({ status: quotation.status });
  }

  const order = await getOrderCart({ orderId, user }, context);
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });

  if (
    !(await modules.products.productExists({
      productId: quotation.productId,
    }))
  )
    throw new ProductNotFoundError({ productId: quotation.productId });

  const quotationConfiguration = await modules.quotations.transformItemConfiguration(
    quotation,
    {
      quantity,
      configuration,
    },
    context,
  );

  const updatedOrderPosition = await modules.orders.positions.addProductItem({
    quantity: quotationConfiguration.quantity,
    configuration: quotationConfiguration.configuration,
    quotationId,
    productId: quotation.productId,
    originalProductId: quotation.productId,
    orderId: order._id,
  });
  await services.orders.updateCalculation(order._id, context);
  return modules.orders.positions.findOrderPosition({ itemId: updatedOrderPosition._id });
}
