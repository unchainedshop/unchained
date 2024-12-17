import { Modules } from '../modules.js';

export async function deleteUserService(this: Modules, { userId }: { userId: string }) {
  const user = await this.users.markDeleted(userId);

  if (!user) return null;

  await this.bookmarks.deleteByUserId(userId);
  await this.quotations.deleteRequestedUserQuotations(userId);
  await this.enrollments.deleteInactiveUserEnrollments(userId);

  const carts = await this.orders.findOrders({ userId, status: null });

  for (const userCart of carts) {
    await this.orders.positions.deleteOrderPositions(userCart?._id);
    await this.orders.payments.deleteOrderPayments(userCart?._id);
    await this.orders.deliveries.deleteOrderDeliveries(userCart?._id);
    await this.orders.discounts.deleteOrderDiscounts(userCart?._id);
    await this.orders.delete(userCart?._id);
  }

  const ordersCount = await this.orders.count({ userId, includeCarts: true });
  const quotationsCount = await this.quotations.count({ userId });
  const reviewsCount = await this.products.reviews.count({ authorId: userId });
  const enrollmentsCount = await this.enrollments.count({ userId });
  const tokens = await this.warehousing.findTokensForUser({ userId });

  if (!ordersCount && !reviewsCount && !enrollmentsCount && !quotationsCount && !tokens?.length) {
    await this.users.deletePermanently({ userId });
  }

  return user;
}
