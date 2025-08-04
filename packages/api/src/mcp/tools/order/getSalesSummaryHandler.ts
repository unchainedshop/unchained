import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const SalesSummarySchema = {
  from: z.string().datetime().optional().describe('Start date (ISO format)'),
  to: z.string().datetime().optional().describe('End date (ISO format)'),
  days: z.number().int().min(1).max(365).optional().describe('Number of days to break summary into'),

  paymentProviderIds: z.array(z.string()).optional(),
  deliveryProviderIds: z.array(z.string()).optional(),
  status: z.array(z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])).optional(),
};

export const SalesSummaryZodSchema = z.object(SalesSummarySchema);
export type SalesSummaryParams = z.infer<typeof SalesSummaryZodSchema>;

export async function getSalesSummaryHandler(context: Context, params: SalesSummaryParams) {
  const { modules, userId } = context;

  try {
    log('handler getSalesSummaryHandler', { userId, params });

    const { from, to, days = 30, paymentProviderIds, deliveryProviderIds, status } = params;

    const endDate = to ? new Date(to) : new Date();
    const startDate = from ? new Date(from) : new Date(endDate.getTime() - (days - 1) * 86400000);

    const [orderPayments, orderDeliveries] = await Promise.all([
      paymentProviderIds?.length
        ? modules.orders.payments.findOrderPaymentsByProviderIds({
            paymentProviderIds: [...paymentProviderIds],
          })
        : [],
      deliveryProviderIds?.length
        ? modules.orders.deliveries.findDeliveryByProvidersId({
            deliveryProviderIds: [...deliveryProviderIds],
          })
        : [],
    ]);

    if (
      (paymentProviderIds?.length > 0 && orderPayments?.length === 0) ||
      (deliveryProviderIds?.length > 0 && orderDeliveries?.length === 0)
    ) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              totalSalesAmount: 0,
              orderCount: 0,
              averageOrderValue: 0,
              currencyCode: null,
              dailySummary: {},
              dateRange: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
              },
            }),
          },
        ],
      };
    }

    const paymentIds = orderPayments.map((p) => p._id);
    const deliveryIds = orderDeliveries.map((d) => d._id);

    const orders = await modules.orders.findOrders({
      dateRange: { from: startDate.toISOString(), to: endDate.toISOString() },
      paymentIds,
      deliveryIds,
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
            dailySummary: Array.from([...dateMap.entries()].reverse()).map(
              ([date, { sales, orders }]) => ({
                date,
                sales: Number(sales.toFixed(2)),
                orders,
                avgOrderValue: orders > 0 ? Math.round(sales / orders) : 0,
              }),
            ),
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
          text: `Error fetching sales summary: ${(error as Error).message}`,
        },
      ],
    };
  }
}
