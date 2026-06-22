import type { Modules } from '../modules.ts';
import { deleteCartService } from './deleteCart.ts';

// Garbage-collect "dead" carts: open carts whose owner no longer exists (the user
// was hard-deleted by a path that did not cascade, or by legacy/migrated data).
// Detection crosses the orders and users collections, so it lives in the service
// layer rather than in either module.
export async function deleteDeadCartsService(this: Modules): Promise<number> {
  const cartUserIds = (await this.orders.findCartUserIds()).filter(Boolean);
  if (!cartUserIds.length) return 0;

  const existingUserIds = new Set(await this.users.findExistingUserIds({ userIds: cartUserIds }));
  const deadUserIds = cartUserIds.filter((userId) => !existingUserIds.has(userId));
  if (!deadUserIds.length) return 0;

  const deadCarts = await this.orders.findCarts({ userIds: deadUserIds }, { projection: { _id: 1 } });

  let deletedCount = 0;
  await Array.fromAsync(deadCarts, async (cart) => {
    await deleteCartService.bind(this)(cart._id);
    deletedCount += 1;
  });
  return deletedCount;
}
