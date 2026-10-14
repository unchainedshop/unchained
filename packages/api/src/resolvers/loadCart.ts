import type { Context } from '../context.ts';
import { OrderLockedError, OrderNotFoundError, OrderWrongStatusError } from '../errors.ts';

async function loadCart(context: Context, orderId?: string) {
  const { modules, services, user, countryCode } = context;
  const order = await services.orders.findOrInitCart({ orderId, user: user!, countryCode });
  if (!order) throw new OrderNotFoundError({ orderId });
  if (!modules.orders.isCart(order)) throw new OrderWrongStatusError({ status: order.status });
  return order;
}

export async function lockCart(context: Context, orderId?: string) {
  const { _id } = await loadCart(context, orderId);
  let lock: { release: () => Promise<void> } | undefined;
  try {
    lock = await context.modules.orders.acquireLock(_id, 'checkout');
    return Object.assign(await loadCart(context, _id), { [Symbol.asyncDispose]: lock.release });
  } catch (error) {
    await lock?.release();
    throw error.cause === 'LOCKED' ? new OrderLockedError({ orderId: _id }) : error;
  }
}
