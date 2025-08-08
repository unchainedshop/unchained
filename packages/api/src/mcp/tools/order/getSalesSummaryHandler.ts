import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { DateRangeSchema, OrderFilterSchema } from '../../utils/sharedSchemas.js';
import { formatSummaryMap, resolveDateRange, resolveOrderFilters } from '../../utils/orderFilters.js';

export const SalesSummarySchema = {
  ...DateRangeSchema,
  ...OrderFilterSchema,
  days: z.number().int().min(1).max(365).optional(),
};

export const SalesSummaryZodSchema = z.object(SalesSummarySchema);
export type SalesSummaryParams = z.infer<typeof SalesSummaryZodSchema>;

export async function getSalesSummaryHandler(context: Context, params: SalesSummaryParams) {
  const { modules, userId } = context;

  try {
    log('handler getSalesSummaryHandler', { userId, params });

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
            totalSalesAmount,
            orderCount,
            averageOrderValue,
            currencyCode: orders[0]?.currencyCode ?? null,
            summary: formatSummaryMap(dateMap),
            dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error fetching sales summary: ${(error as Error).message}`,
        },
      ],
    };
  }
}
