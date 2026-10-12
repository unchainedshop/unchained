import { ordersSettings, type Order, type OrderPosition } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';
import { createServiceError } from '../errors.ts';

interface CartProductItem {
  productId: string;
  quantity: number;
  configuration?: { key: string; value: string }[];
}

const resolveCartProducts = (modules: Modules, items: CartProductItem[]) =>
  Promise.all(
    items.map(async ({ productId, quantity, configuration }) => {
      const originalProduct = await modules.products.findProduct({ productId });
      if (!originalProduct) {
        throw createServiceError('ProductNotFoundError', `Product not found: ${productId}`, {
          productId,
        });
      }
      if (quantity < 1) {
        throw createServiceError('InvalidQuantityError', `Invalid quantity for product: ${productId}`, {
          productId,
          quantity,
        });
      }
      const product = await modules.products.resolveOrderableProduct(originalProduct, {
        configuration,
      });
      return { originalProductId: originalProduct._id, product, quantity, configuration };
    }),
  );

export async function addMultipleCartProductsService(
  this: Modules,
  { order, items }: { order: Order; items: CartProductItem[] },
  unchainedAPI: Record<string, any> = {},
): Promise<OrderPosition[]> {
  const cartProducts = await resolveCartProducts(this, items);
  for (const { product, quantity, configuration } of cartProducts) {
    await ordersSettings.validateOrderPosition(
      { order, product, configuration, quantityDiff: quantity },
      { ...unchainedAPI, modules: this },
    );
  }

  const positions: OrderPosition[] = [];
  for (const { originalProductId, product, quantity, configuration } of cartProducts) {
    positions.push(
      await this.orders.positions.addProductItem({
        orderId: order._id,
        originalProductId,
        productId: product._id,
        quantity,
        configuration,
      }),
    );
  }
  return positions;
}
