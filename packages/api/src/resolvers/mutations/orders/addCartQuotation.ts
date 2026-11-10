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
} from '../../../errors.ts';
import { QuotationDirector } from '@unchainedshop/core';
import { lockCart } from '../../loadCart.ts';

export default async function addCartQuotation(
  root: never,
  params: {
    orderId?: string;
    quotationId: string;
    quantity: number;
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

  if (quantity < 1) throw new OrderQuantityTooLowError({ quantity });

  const quotation = await modules.quotations.findQuotation({ quotationId });
  if (!quotation) throw new QuotationNotFoundError({ quotationId });

  if (quotation.status !== QuotationStatus.PROPOSED) {
    throw new QuotationWrongStatusError({ status: quotation.status });
  }

  await using order = await lockCart(context, orderId);

  if (
    !(await modules.products.productExists({
      productId: quotation.productId,
    }))
  )
    throw new ProductNotFoundError({ productId: quotation.productId });

  const director = await QuotationDirector.actions({ quotation }, context);
  const quotationConfiguration = await director.transformItemConfiguration({
    quantity,
    configuration,
  });

  if (!quotationConfiguration) throw new QuotationItemConfigurationError({ configuration });

  const updatedOrderPosition = await modules.orders.positions.addProductItem({
    quantity: quotationConfiguration.quantity || 1,
    configuration: quotationConfiguration.configuration,
    quotationId,
    productId: quotation.productId,
    originalProductId: quotation.productId,
    orderId: order._id,
  });
  await services.orders.updateCalculation(order._id);
  return modules.orders.positions.findOrderPosition({ itemId: updatedOrderPosition._id });
}
