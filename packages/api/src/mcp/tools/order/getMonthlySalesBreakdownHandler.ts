import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { DateRangeSchema, OrderFilterSchema } from '../../utils/sharedSchemas.js';
import { formatSummaryMap, resolveDateRange, resolveOrderFilters } from '../../utils/orderFilters.js';

export const MonthlySalesBreakdownSchema = {
  ...DateRangeSchema,
  ...OrderFilterSchema,
};

export const MonthlySalesBreakdownZodSchema = z.object(MonthlySalesBreakdownSchema);
export type MonthlySalesBreakdownParams = z.infer<typeof MonthlySalesBreakdownZodSchema>;

export async function getMonthlySalesBreakdownHandler(
  context: Context,
  params: MonthlySalesBreakdownParams,
) {
  const { modules, userId } = context;

  try {
    log('handler getMonthlySalesBreakdownHandler', { userId, params });

    const { from, to, paymentProviderIds, deliveryProviderIds, status } = params;

    const { startDate, endDate } = resolveDateRange(from, to);
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
      dateRange: { from: startDate.toISOString(), to: endDate.toISOString() },
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
            totalSalesAmount,
            orderCount,
            averageOrderValue,
            currencyCode: orders[0]?.currencyCode ?? null,
            summary: formatSummaryMap(monthlyMap),
            dateRange: {
              start: startDate.toISOString(),
              end: endDate.toISOString(),
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
          text: `Error fetching monthly sales breakdown: ${(error as Error).message}`,
        },
      ],
    };
  }
}
