import type { Context } from '../../../../context.ts';
import { OrderStatus } from '@unchainedshop/core-orders';
import { resolveDateRange } from '../../../utils/orderFilters.ts';
import type { Params } from '../schemas.ts';

export default async function getTopCustomers(context: Context, params: Params<'TOP_CUSTOMERS'>) {
  const { modules, loaders } = context;
  const { from: dateStart, to: dateEnd, limit = 10 } = params;

  const { startDate, endDate } = resolveDateRange(dateStart, dateEnd);

  const orders = await modules.orders.findOrders(
    {
      status: [OrderStatus.CONFIRMED, OrderStatus.FULFILLED],
      dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
    },
    { fields: ['_id'] },
  );

  const orderIds = orders.map(({ _id }) => _id);

  const topCustomers = await modules.orders.statistics.getTopCustomers(orderIds, { limit });

  const normalizedCustomers = await Promise.all(
    topCustomers.map(async (c) => {
      const user = await modules.users.findUserById(c.userId);
      const avatar =
        user?.avatarId &&
        (await loaders.fileLoader.load({
          fileId: user?.avatarId,
        }));
      return {
        userId: c.userId?.toString?.() ?? null,
        user: avatar
          ? {
              ...user,
              avatar,
            }
          : null,
        currencyCode: c?.currencyCode || null,
        totalSpent: c?.totalSpent,
        orderCount: c?.orderCount,
        lastOrderDate: c.lastOrderDate,
        averageOrderValue: Math.round(c?.averageOrderValue),
      };
    }),
  );

  return { customers: normalizedCustomers };
}
