import type { Context } from '../../../../context.ts';
import { OrderStatus } from '@unchainedshop/core-orders';
import { removeConfidentialServiceHashes } from '@unchainedshop/core-users';
import { resolveDateRange } from '../../../utils/orderFilters.ts';
import type { Params } from '../schemas.ts';

export default async function getTopCustomers(context: Context, params: Params<'TOP_CUSTOMERS'>) {
  const { modules, services } = context;
  const { from: dateStart, to: dateEnd, limit = 10 } = params;

  const { startDate, endDate } = resolveDateRange(dateStart, dateEnd);

  const orders = await modules.orders.findOrders(
    {
      status: [OrderStatus.CONFIRMED, OrderStatus.FULFILLED],
      dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
    },
    {
      projection: {
        _id: 1,
      },
    },
  );

  const orderIds = orders.map(({ _id }) => _id);

  const topCustomers = await modules.orders.statistics.getTopCustomers(orderIds, { limit });

  const users = await Promise.all(topCustomers.map(({ userId }) => modules.users.findUserById(userId)));
  const avatars = await services.files.resolveMediaFiles(
    users.flatMap((user) => (user?.avatarId ? [{ mediaId: user.avatarId }] : [])),
  );

  return {
    customers: topCustomers.map((c, index) => {
      const user = users[index];
      return {
        userId: c.userId?.toString?.() ?? null,
        user: user && {
          ...removeConfidentialServiceHashes(user),
          avatar: avatars.filter(({ mediaId }) => mediaId === user.avatarId),
        },
        currencyCode: c?.currencyCode || null,
        totalSpent: c?.totalSpent,
        orderCount: c?.orderCount,
        lastOrderDate: c.lastOrderDate,
        averageOrderValue: Math.round(c?.averageOrderValue),
      };
    }),
  };
}
