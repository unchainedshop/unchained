import type { Order } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';

/** Locks each product of the order with a tokenization.supply until the result is disposed */
export async function lockOrderSupply(this: Modules, order: Order) {
  const positions = await this.orders.positions.findOrderPositions({ orderId: order._id });
  const products = await Promise.all(
    positions.map(({ productId }) => this.products.findProduct({ productId })),
  );
  return this.orders.lockSupply(
    products.flatMap((product) => (product?.tokenization?.supply ? [product._id] : [])),
  );
}
