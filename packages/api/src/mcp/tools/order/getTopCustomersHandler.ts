import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { resolveDateRange } from '../../utils/orderFilters.js';
import { OrderStatus } from '@unchainedshop/core-orders';

export const GetTopCustomersSchema = {
  limit: z.number().int().min(1).max(100).optional().describe('Max number of customers to return'),
  status: z.string().optional().describe('Order status to filter by (e.g., CONFIRMED, DELIVERED)'),
  dateRange: z
    .object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    })
    .optional()
    .describe('Optional date range to filter orders'),
};

export const GetTopCustomersZodSchema = z.object(GetTopCustomersSchema);
export type GetTopCustomersParams = z.infer<typeof GetTopCustomersZodSchema>;

export async function getTopCustomersHandler(context: Context, params: GetTopCustomersParams) {
  const { modules, userId, loaders } = context;
  const { status, dateRange, limit = 10 } = params;

  try {
    log('handler getTopCustomersHandler', { userId, params });

    const match: any = {};
    const { startDate, endDate } = resolveDateRange(dateRange?.start, dateRange?.end);

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
    if (status) match.status = status;
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
        const avatar = await loaders.fileLoader.load({
          fileId: user?.avatarId,
        });
        return {
          userId: c._id?.toString?.() ?? null,
          user: {
            ...user,
            avatar,
          },
          currencyCode: c?.currencyCode || null,
          totalSpent: c?.totalSpent,
          orderCount: c?.orderCount,
          lastOrderDate: c.lastOrderDate,
          averageOrderValue: Math.round(c?.averageOrderValue),
        };
      }),
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ customers: normalizedCustomers }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error fetching top customers: ${(error as Error).message}`,
        },
      ],
    };
  }
}
