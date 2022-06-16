import { log } from '@unchainedshop/logger';
import { QuotationStatus } from 'meteor/unchained:core-quotations';
import { Context, Root } from '@unchainedshop/types/api';
import { Configuration } from '@unchainedshop/types/common';
import {
  QuotationNotFoundError,
  QuotationWrongStatusError,
  OrderQuantityTooLowError,
  InvalidIdError,
} from '../../../errors';
import { getOrderCart } from '../utils/getOrderCart';

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
