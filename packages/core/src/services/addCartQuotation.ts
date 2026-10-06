import { type Order, type OrderPosition, ordersSettings } from '@unchainedshop/core-orders';
import { type Quotation, QuotationStatus } from '@unchainedshop/core-quotations';
import type { Modules } from '../modules.ts';
import { QuotationDirector } from '../directors/QuotationDirector.ts';
import { createServiceError } from '../errors.ts';
import { isQuotationReserved } from './reserveOrderQuotationsForCheckout.ts';

/**
 * Adds a proposed quotation to a cart. The quotation adapter's transformItemConfiguration
 * decides the total quantity and the configuration of the quotation's line: adding the
 * quotation again adds to its line. Does not recalculate the cart.
 */
export async function addCartQuotationService(
  this: Modules,
  {
    order,
    quotation,
    quantity,
    configuration,
  }: {
    order: Order;
    quotation: Quotation;
    quantity?: number | null;
    configuration?: { key: string; value: string }[] | null;
  },
  unchainedAPI: Record<string, any> = {},
): Promise<OrderPosition> {
  const context = { ...unchainedAPI, modules: this };

  if (quotation.status !== QuotationStatus.PROPOSED) {
    throw createServiceError(
      'QuotationWrongStatusError',
      `Quotation ${quotation._id} is ${quotation.status}, not PROPOSED`,
    );
  }
  // The quoted price only applies in the quotation's currency
  if (quotation.currencyCode !== order.currencyCode) {
    throw createServiceError(
      'QuotationInvalidError',
      `Quotation ${quotation._id} is not in the currency of order ${order._id}`,
    );
  }

  // A pending order of the quotation reserves it until the order is confirmed or rejected
  if (await isQuotationReserved.call(this, quotation._id, { exceptOrderId: order._id })) {
    throw createServiceError(
      'QuotationInvalidError',
      `Quotation ${quotation._id} is reserved by another order`,
    );
  }

  const product = await this.products.findProduct({ productId: quotation.productId });
  if (!product) {
    throw createServiceError('ProductNotFoundError', `Product not found: ${quotation.productId}`);
  }

  const existingPosition = (await this.orders.positions.findOrderPositions({ orderId: order._id })).find(
    (position) => position.quotationId === quotation._id,
  );
  const existingQuantity = existingPosition?.quantity || 0;

  // Without a quantity, the quotation is accepted as quoted
  const requestedQuantity = existingQuantity + (quantity ?? quotation.quantity ?? 1);
  const director = await QuotationDirector.actions({ quotation }, context);
  const quotationConfiguration = await director.transformItemConfiguration({
    quantity: requestedQuantity,
    configuration: configuration ?? existingPosition?.configuration ?? [],
  });
  if (!quotationConfiguration) {
    throw createServiceError(
      'QuotationItemConfigurationError',
      `Quotation ${quotation._id} does not take quantity ${requestedQuantity}`,
    );
  }
  const lineQuantity = quotationConfiguration.quantity || requestedQuantity;

  await ordersSettings.validateOrderPosition(
    {
      order,
      product,
      configuration: quotationConfiguration.configuration,
      quantityDiff: lineQuantity - existingQuantity,
    },
    context,
  );

  const position = existingPosition
    ? await this.orders.positions.updateProductItem({
        orderPositionId: existingPosition._id,
        quantity: lineQuantity,
        configuration: quotationConfiguration.configuration ?? null,
      })
    : await this.orders.positions.addProductItem({
        quantity: lineQuantity,
        configuration: quotationConfiguration.configuration,
        quotationId: quotation._id,
        productId: quotation.productId,
        originalProductId: quotation.productId,
        orderId: order._id,
      });
  if (!position) {
    throw createServiceError('OrderItemNotFoundError', `Order item not found: ${existingPosition?._id}`);
  }
  return position;
}
