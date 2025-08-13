import { Context } from '../../../../context.js';
import { OrderStatus } from '@unchainedshop/core-orders';
import { resolveDateRange } from '../../../utils/orderFilters.js';
import { getNormalizedProductDetails } from '../../../utils/getNormalizedProductDetails.js';
import { Params } from '../schemas.js';

export default async function getTopProducts(context: Context, params: Params<'TOP_PRODUCTS'>) {
  const { modules } = context;
  const { from, to, limit = 10 } = params;

  const match: any = {};
  const { startDate, endDate } = resolveDateRange(from, to);

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
  if (orderIds?.length) match.orderId = { $in: orderIds };

  const topProducts = await modules.orders.positions.aggregatePositions({
    match,
    project: {
      productId: 1,
      quantity: 1,
      itemAmount: {
        $let: {
          vars: {
            item: {
              $first: {
                $filter: {
                  input: '$calculation',
                  as: 'c',
                  cond: { $eq: ['$$c.category', 'ITEM'] },
                },
              },
            },
          },
          in: '$$item.amount',
        },
      },
    },
    group: {
      _id: '$productId',
      totalSold: { $sum: '$quantity' },
      totalRevenue: { $sum: '$itemAmount' },
    },
    matchAfterGroup: {
      totalSold: { $gt: 0 },
    },
    sort: { totalSold: -1 },
    limit,
  });

  const normalizedTopSellingProducts = await Promise.all(
    topProducts.map(async (p) => {
      const product = await getNormalizedProductDetails(p._id, context);
      return {
        productId: p._id?.toString?.() ?? null,
        product,
        totalSold: p.totalSold,
        totalRevenue: p.totalRevenue,
      };
    }),
  );

  return {
    products: normalizedTopSellingProducts,
    dateRange: {
      start: from ? new Date(from).toISOString() : null,
      end: to ? new Date(to).toISOString() : null,
    },
  };
}
