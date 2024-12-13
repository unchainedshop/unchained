import { Modules } from '../modules.js';

export const deleteUserService = async (
  { userId }: { userId: string },
  unchainedAPI: { modules: Modules },
) => {
  const { modules } = unchainedAPI;

  const user = await modules.users.markDeleted(userId);

  if (!user) return null;

  await modules.bookmarks.deleteByUserId(userId);
  await modules.quotations.deleteRequestedUserQuotations(userId);
  await modules.enrollments.deleteInactiveUserEnrollments(userId);

  const carts = await modules.orders.findOrders({ userId, status: null });

  for (const userCart of carts) {
    await modules.orders.positions.deleteOrderPositions(userCart?._id);
    await modules.orders.payments.deleteOrderPayments(userCart?._id);
    await modules.orders.deliveries.deleteOrderDeliveries(userCart?._id);
    await modules.orders.discounts.deleteOrderDiscounts(userCart?._id);
    await modules.orders.delete(userCart?._id);
  }

  const ordersCount = await modules.orders.count({ userId, includeCarts: true });
  const quotationsCount = await modules.quotations.count({ userId });
  const reviewsCount = await modules.products.reviews.count({ authorId: userId });
  const enrollmentsCount = await modules.enrollments.count({ userId });
  const tokens = await modules.warehousing.findTokensForUser({ userId });

  if (!ordersCount && !reviewsCount && !enrollmentsCount && !quotationsCount && !tokens?.length) {
    await modules.users.deletePermanently({ userId });
  }

  return user;
};
