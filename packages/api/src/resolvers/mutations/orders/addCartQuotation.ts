import { log } from '@unchainedshop/logger';
import { QuotationStatus } from '@unchainedshop/core-quotations';
import { Context, Root } from '@unchainedshop/types/api.js';
import { Configuration } from '@unchainedshop/types/common.js';
import {
  QuotationNotFoundError,
  QuotationWrongStatusError,
  OrderQuantityTooLowError,
  InvalidIdError,
  OrderWrongStatusError,
} from '../../../errors.js';
import { getOrderCart } from '../utils/getOrderCart.js';

export default async function addCartQuotation(
  root: Root,
  params: {
    orderId?: string;
    quotationId: string;
    quantity: number;
    configuration: Configuration;
  },
  context: Context,
) {
  const { modules, userId, user } = context;
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

  const product = await modules.products.findProduct({
    productId: quotation.productId,
  });

  const quotationConfiguration = await modules.quotations.transformItemConfiguration(
    quotation,
    {
      quantity,
      configuration,
    },
    context,
  );

  return modules.orders.positions.addProductItem(
    {
      quantity: quotationConfiguration.quantity,
      configuration: quotationConfiguration.configuration,
      quotationId,
    },
    { order, product },
    context,
  );
}
