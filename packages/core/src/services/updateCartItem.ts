import { type Order, type OrderPosition, ordersSettings } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';
import { QuotationDirector } from '../directors/QuotationDirector.ts';
import { createServiceError } from '../errors.ts';

/**
 * Changes quantity and configuration of a cart item. A quotation position is priced as quoted,
 * so its quotation adapter decides which quantity and configuration it may take, as it does when
 * the quotation is added. Does not recalculate the cart.
 */
export async function updateCartItemService(
  this: Modules,
  {
    order,
    item,
    quantity,
    configuration,
  }: {
    order: Order;
    item: OrderPosition;
    // undefined: 1, null: unchanged
    quantity?: number | null;
    configuration?: { key: string; value: string }[] | null;
  },
  unchainedAPI: Record<string, any> = {},
): Promise<OrderPosition | null> {
  const context = { ...unchainedAPI, modules: this };

  const product = await this.products.findProduct({ productId: item.productId });
  if (!product) {
    throw createServiceError('ProductNotFoundError', `Product not found: ${item.productId}`);
  }

  let itemQuantity = quantity === undefined ? 1 : quantity;
  let itemConfiguration = configuration;
  if (item.quotationId) {
    const quotation = await this.quotations.findQuotation({ quotationId: item.quotationId });
    if (!quotation) {
      throw createServiceError('QuotationNotFoundError', `Quotation not found: ${item.quotationId}`);
    }
    const director = await QuotationDirector.actions({ quotation }, context);
    // without a quantity, a quotation line keeps its quantity
    const requestedQuantity = quantity || item.quantity;
    const quotationConfiguration = await director.transformItemConfiguration({
      quantity: requestedQuantity,
      configuration: configuration || item.configuration || [],
    });
    if (!quotationConfiguration) {
      throw createServiceError(
        'QuotationItemConfigurationError',
        `Quotation ${quotation._id} does not take quantity ${requestedQuantity}`,
      );
    }
    itemQuantity = quotationConfiguration.quantity || requestedQuantity;
    itemConfiguration = quotationConfiguration.configuration;
  }

  await ordersSettings.validateOrderPosition(
    {
      order,
      product,
      configuration: itemConfiguration,
      quantityDiff: (itemQuantity as number) - item.quantity,
    },
    context,
  );

  return this.orders.positions.updateProductItem({
    orderPositionId: item._id,
    quantity: itemQuantity || null,
    configuration: itemConfiguration || null,
  });
}
