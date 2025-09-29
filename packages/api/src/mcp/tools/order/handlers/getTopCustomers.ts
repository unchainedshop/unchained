import { Context } from '../../../../context.js';
import { OrderStatus } from '@unchainedshop/core-orders';
import { resolveDateRange } from '../../../utils/orderFilters.js';
import { Params } from '../schemas.js';

export default async function getTopCustomers(context: Context, params: Params<'TOP_CUSTOMERS'>) {
  const { modules, loaders } = context;
  const { customerStatus, from: dateStart, to: dateEnd, limit = 10 } = params;

  const match: any = {};
  const { startDate, endDate } = resolveDateRange(dateStart, dateEnd);

  const orders = await modules.orders.findOrders(
    {
      status: [OrderStatus.CONFIRMED, OrderStatus.FULLFILLED],
      dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
    },
    {
      projection: {
        _id: 1,
      },
    },
  );

  const orderIds = orders.map(({ _id }) => _id);
  if (startDate) match.created = { ...(match.created || {}), $gte: startDate };
  if (endDate) match.created = { ...(match.created || {}), $lte: endDate };
  if (customerStatus) match.status = customerStatus;
  if (orderIds?.length) match._id = { $in: orderIds };

  const topCustomers = await modules.orders.aggregateOrders({
    match,
    project: {
      userId: 1,
      created: 1,
      currencyCode: 1,
      itemAmount: {
        $let: {
          vars: {
            item: {
              $first: {
                $filter: {
                  input: '$calculation',
                  as: 'c',
                  cond: { $eq: ['$$c.category', 'ITEMS'] },
                },
              },
            },
          },
          in: '$$item.amount',
        },
      },
    },
    group: {
      _id: { userId: '$userId', currencyCode: '$currencyCode' },
      totalSpent: { $sum: '$itemAmount' },
      orderCount: { $sum: 1 },
      lastOrderDate: { $max: '$created' },
    },
    matchAfterGroup: {
      totalSpent: { $gt: 0 },
    },
    addFields: {
      averageOrderValue: {
        $cond: [{ $eq: ['$orderCount', 0] }, 0, { $divide: ['$totalSpent', '$orderCount'] }],
      },
      currencyCode: '$_id.currencyCode',
      _id: '$_id.userId',
    },
    sort: { totalSpent: -1 },
    limit,
  });

  const normalizedCustomers = await Promise.all(
    topCustomers.map(async (c) => {
      const user = await modules.users.findUserById(c._id);
      const avatar =
        user?.avatarId &&
        (await loaders.fileLoader.load({
          fileId: user?.avatarId,
        }));
      return {
        userId: c._id?.toString?.() ?? null,
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
