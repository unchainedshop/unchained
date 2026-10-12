import { ordersSettings, type Order } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';
import { resolveCartProducts, type CartProductItem } from './addMultipleCartProducts.ts';

const positionKey = (position: {
  originalProductId: string;
  productId: string;
  configuration?: { key: string; value: string }[] | null;
  quotationId?: string | null;
}) =>
  JSON.stringify([
    position.originalProductId,
    position.productId,
    position.configuration ?? null,
    position.quotationId ?? null,
  ]);

export async function replaceCartProductsService(
  this: Modules,
  { order, items }: { order: Order; items: CartProductItem[] },
  unchainedAPI: Record<string, any> = {},
): Promise<void> {
  const cartProducts = await resolveCartProducts(this, items);
  const wantedPositions = new Map<string, (typeof cartProducts)[number]>();
  for (const cartProduct of cartProducts) {
    const key = positionKey({ ...cartProduct, productId: cartProduct.product._id });
    const quantity = (wantedPositions.get(key)?.quantity ?? 0) + cartProduct.quantity;
    wantedPositions.set(key, { ...cartProduct, quantity });
  }

  const currentPositions = await this.orders.positions.findOrderPositions({ orderId: order._id });
  const currentQuantity = (key: string) =>
    currentPositions
      .filter((position) => positionKey(position) === key)
      .reduce((sum, { quantity }) => sum + quantity, 0);
  for (const [key, { product, quantity, configuration }] of wantedPositions) {
    await ordersSettings.validateOrderPosition(
      { order, product, configuration, quantityDiff: quantity - currentQuantity(key) },
      { ...unchainedAPI, modules: this },
    );
  }

  for (const position of currentPositions) {
    const key = positionKey(position);
    const wanted = wantedPositions.get(key);
    if (!wanted) {
      await this.orders.positions.delete(position._id);
      continue;
    }
    wantedPositions.delete(key);
    if (position.quantity !== wanted.quantity) {
      await this.orders.positions.updateProductItem({
        orderPositionId: position._id,
        quantity: wanted.quantity,
        configuration: null,
      });
    }
  }
  for (const { originalProductId, product, quantity, configuration } of wantedPositions.values()) {
    await this.orders.positions.addProductItem({
      orderId: order._id,
      originalProductId,
      productId: product._id,
      quantity,
      configuration,
    });
  }
}
