import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export const MonthlySalesBreakdownSchema = {
  from: z.string().datetime().optional().describe('Start date (ISO format)'),
  to: z.string().datetime().optional().describe('End date (ISO format)'),
  paymentProviderIds: z.array(z.string()).optional(),
  deliveryProviderIds: z.array(z.string()).optional(),
  status: z.array(z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])).optional(),
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

    const endDate = to ? new Date(to) : new Date();
    const startDate = from
      ? new Date(from)
      : new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1);

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
              summary: {},
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
            summary: Array.from([...monthlyMap.entries()].reverse()).map(
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
          text: `Error fetching monthly sales breakdown: ${(error as Error).message}`,
        },
      ],
    };
  }
}
