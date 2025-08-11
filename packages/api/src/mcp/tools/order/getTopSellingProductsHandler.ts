import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';
import { OrderStatus } from '@unchainedshop/core-orders';
import { resolveDateRange } from '../../utils/orderFilters.js';

export const TopSellingProductsSchema = {
  from: z.string().datetime().optional().describe('Start date (ISO format)'),
  to: z.string().datetime().optional().describe('End date (ISO format)'),
  limit: z.number().int().min(1).max(100).optional().default(10),
};

export const TopSellingProductsZodSchema = z.object(TopSellingProductsSchema);
export type TopSellingProductsParams = z.infer<typeof TopSellingProductsZodSchema>;

export async function getTopSellingProductsHandler(context: Context, params: TopSellingProductsParams) {
  const { modules, userId } = context;
  const { from, to, limit } = params;

  try {
    log('handler getTopSellingProductsHandler', { userId, params });

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
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            products: normalizedTopSellingProducts,
            dateRange: {
              start: from ? new Date(from).toISOString() : null,
              end: to ? new Date(to).toISOString() : null,
            },
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error fetching top-selling products: ${(error as Error).message}`,
        },
      ],
    };
  }
}
