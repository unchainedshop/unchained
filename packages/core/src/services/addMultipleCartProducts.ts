import type { Modules } from '../modules.ts';
import type { Order } from '@unchainedshop/core-orders';
import { ordersSettings } from '@unchainedshop/core-orders';

export async function addMultipleCartProductsService(
  this: Modules,
  {
    orderId,
    items,
    context,
  }: {
    orderId: string;
    items: {
      productId: string;
      quantity: number;
      configuration?: { key: string; value: string }[];
    }[];
    context: {
      localeContext: Intl.Locale;
      userId?: string;
      countryCode?: string;
    };
  },
): Promise<Order | null> {
  const order = await this.orders.findOrder({ orderId });
  if (!order) return null;

  for (const { productId, quantity, configuration } of items) {
    const originalProduct = await this.products.findProduct({ productId });
    if (!originalProduct) {
      throw new Error(`Product not found: ${productId}`);
    }

    if (quantity < 1) {
      throw new Error(`Invalid quantity for product: ${productId}`);
    }

    const product = await this.products.resolveOrderableProduct(originalProduct, { configuration });

    await ordersSettings.validateOrderPosition(
      { order, product, configuration, quantityDiff: quantity },
      { modules: this, ...context },
    );

    await this.orders.positions.addProductItem({
      quantity,
      configuration,
      originalProductId: originalProduct._id,
      productId: product._id,
      orderId: order._id,
    });
  }

  return order;
}
