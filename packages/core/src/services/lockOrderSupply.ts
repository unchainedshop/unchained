import type { Order } from '@unchainedshop/core-orders';
import type { Modules } from '../modules.ts';

/** Locks each product of the order with a tokenization.supply until the result is disposed */
export async function lockOrderSupply(this: Modules, order: Order) {
  const positions = await this.orders.positions.findOrderPositions({ orderId: order._id });
  const products = await Promise.all(
    positions.map(({ productId }) => this.products.findProduct({ productId })),
  );
  const limitedSupplyProductIds = [
    ...new Set(products.flatMap((product) => (product?.tokenization?.supply ? [product._id] : []))),
  ].sort();
  const locks: { release: () => Promise<void> }[] = [];
  const release = async () => {
    await Promise.all(locks.splice(0).map((lock) => lock.release()));
  };

  try {
    for (const productId of limitedSupplyProductIds) {
      locks.push(await this.orders.acquireLock(productId, 'supply'));
    }
  } catch (error) {
    await release();
    throw error;
  }
  return { [Symbol.asyncDispose]: release };
}
