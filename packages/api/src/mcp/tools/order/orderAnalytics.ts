import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { DateRangeSchema, OrderFilterSchema } from '../../utils/sharedSchemas.js';
import { formatSummaryMap, resolveDateRange, resolveOrderFilters } from '../../utils/orderFilters.js';
import { OrderStatus } from '@unchainedshop/core-orders';
import { getNormalizedProductDetails } from '../../utils/getNormalizedProductDetails.js';

export const OrderAnalyticsSchema = {
  action: z
    .enum(['SALES_SUMMARY', 'MONTHLY_BREAKDOWN', 'TOP_CUSTOMERS', 'TOP_PRODUCTS'])
    .describe(
      'Analytics action: SALES_SUMMARY (daily sales with totals), MONTHLY_BREAKDOWN (12-month sales breakdown), TOP_CUSTOMERS (highest spending customers), TOP_PRODUCTS (best-selling products by quantity/revenue)',
    ),

  ...DateRangeSchema,
  ...OrderFilterSchema,

  days: z
    .number()
    .int()
    .min(1)
    .max(365)
    .optional()
    .describe('Number of days for daily breakdown (SALES_SUMMARY only). Default: 30, Max: 365'),

  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe(
      'Maximum number of results to return (TOP_CUSTOMERS/TOP_PRODUCTS only). Default: 10, Max: 100',
    ),

  customerStatus: z
    .string()
    .optional()
    .describe(
      'Specific order status for customer analysis (TOP_CUSTOMERS only). Uses CONFIRMED+FULFILLED if not specified',
    ),
};

export const OrderAnalyticsZodSchema = z.object(OrderAnalyticsSchema);
export type OrderAnalyticsParams = z.infer<typeof OrderAnalyticsZodSchema>;

export async function orderAnalytics(context: Context, params: OrderAnalyticsParams) {
  const { action } = params;
  const { modules, userId, loaders } = context;

  try {
    log('handler orderAnalytics', { userId, params });

    switch (action) {
      case 'SALES_SUMMARY': {
        const { from, to, days = 30, paymentProviderIds, deliveryProviderIds, status } = params;
        const { startDate, endDate } = resolveDateRange(from, to, days);

        const filters = await resolveOrderFilters(modules, { paymentProviderIds, deliveryProviderIds });
        if (!filters) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  totalSalesAmount: 0,
                  orderCount: 0,
                  averageOrderValue: 0,
                  currencyCode: null,
                  summary: [],
                  dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
                }),
              },
            ],
          };
        }

        const orders = await modules.orders.findOrders({
          dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
          ...filters,
          status,
        } as any);

        let totalSalesAmount = 0;
        let orderCount = 0;

        const dateMap = new Map<string, { sales: number; orders: number }>();
        for (let i = 0; i < days; i++) {
          const date = new Date(endDate.getTime() - i * 86400000);
          const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dateMap.set(label, { sales: 0, orders: 0 });
        }

        for (const order of orders) {
          const orderDate = new Date(order.created);
          if (orderDate < startDate || orderDate > endDate) continue;

          orderCount++;
          const itemsAmount = order.calculation?.find((c) => c.category === 'ITEMS')?.amount || 0;
          totalSalesAmount += itemsAmount;

          const label = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const entry = dateMap.get(label);
          if (entry) {
            entry.sales += itemsAmount;
            entry.orders += 1;
          }
        }

        const averageOrderValue = orderCount > 0 ? totalSalesAmount / orderCount : 0;

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: {
                  totalSalesAmount,
                  orderCount,
                  averageOrderValue,
                  currencyCode: orders[0]?.currencyCode ?? null,
                  summary: formatSummaryMap(dateMap),
                  dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
                },
              }),
            },
          ],
        };
      }

      case 'MONTHLY_BREAKDOWN': {
        const { from, to, paymentProviderIds, deliveryProviderIds, status } = params;
        const { startDate, endDate } = resolveDateRange(from, to);

        const filters = await resolveOrderFilters(modules, { paymentProviderIds, deliveryProviderIds });
        if (!filters) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  action,
                  data: {
                    totalSalesAmount: 0,
                    orderCount: 0,
                    averageOrderValue: 0,
                    currencyCode: null,
                    summary: [],
                    dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
                  },
                }),
              },
            ],
          };
        }

        const orders = await modules.orders.findOrders({
          dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
          status,
          ...filters,
        } as any);

        let totalSalesAmount = 0;
        let orderCount = 0;

        const monthlyMap = new Map<string, { sales: number; orders: number }>();

        for (let i = 0; i < 12; i++) {
          const date = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
          const label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyMap.set(label, { sales: 0, orders: 0 });
        }

        for (const order of orders) {
          const orderDate = new Date(order.created);
          if (orderDate < startDate || orderDate > endDate) continue;

          orderCount++;
          const itemsAmount = order.calculation?.find((c) => c.category === 'ITEMS')?.amount || 0;
          totalSalesAmount += itemsAmount;

          const label = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
          const entry = monthlyMap.get(label);
          if (entry) {
            entry.sales += itemsAmount;
            entry.orders += 1;
          }
        }

        const averageOrderValue = orderCount > 0 ? totalSalesAmount / orderCount : 0;

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: {
                  totalSalesAmount,
                  orderCount,
                  averageOrderValue,
                  currencyCode: orders[0]?.currencyCode ?? null,
                  summary: formatSummaryMap(monthlyMap),
                  dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
                },
              }),
            },
          ],
        };
      }

      case 'TOP_CUSTOMERS': {
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
              text: JSON.stringify({ action, data: { customers: normalizedCustomers } }),
            },
          ],
        };
      }

      case 'TOP_PRODUCTS': {
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
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: {
                  products: normalizedTopSellingProducts,
                  dateRange: {
                    start: from ? new Date(from).toISOString() : null,
                    end: to ? new Date(to).toISOString() : null,
                  },
                },
              }),
            },
          ],
        };
      }

      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error in order analytics ${action.toLowerCase()}: ${(error as Error).message}`,
        },
      ],
    };
  }
}
