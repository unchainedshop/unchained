import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

const DateFilterInput = z.object({
  from: z.string().datetime().optional().describe('Start date (ISO format)'),
  to: z.string().datetime().optional().describe('End date (ISO format)'),
});

export const SalesSummarySchema = {
  dateRange: DateFilterInput.optional(),
  currencyCode: z.string().optional(),
  paymentProviderIds: z.array(z.string()).optional(),
  deliveryProviderIds: z.array(z.string()).optional(),
  status: z.array(z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])).optional(),
};

export const getSalesSummaryZodSchema = z.object(SalesSummarySchema);
export type GetSalesSummaryParams = z.infer<typeof getSalesSummaryZodSchema>;

export async function getSalesSummaryHandler(context: Context, params: GetSalesSummaryParams) {
  const { modules, userId } = context;
  const { paymentProviderIds, deliveryProviderIds, ...restParams } = params;
  try {
    log('handler getSalesSummaryHandler', { userId, params });

    const [orderPayments, orderDeliveries] = await Promise.all([
      paymentProviderIds?.length
        ? modules.orders.payments.findOrderPaymentsByProviderIds({
            paymentProviderIds: [...paymentProviderIds],
          })
        : [],
      paymentProviderIds?.length
        ? modules.orders.deliveries.findDeliveryByProvidersId({
            deliveryProviderIds: [...paymentProviderIds],
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
            }),
          },
        ],
      };
    }

    const paymentIds = orderPayments.map((p) => p._id);
    const deliveryIds = orderDeliveries.map((d) => d._id);

    const orders = await modules.orders.findOrders({
      ...restParams,
      paymentIds,
      deliveryIds,
    } as any);

    let totalSalesAmount = 0;
    for (const order of orders) {
      const itemTotal = order.calculation?.find((c) => c.category === 'ITEMS')?.amount || 0;
      totalSalesAmount += itemTotal;
    }

    const orderCount = orders?.length;
    const averageOrderValue = orderCount > 0 ? Math.round(totalSalesAmount / orderCount) : 0;

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            totalSalesAmount,
            orderCount,
            averageOrderValue,
            currencyCode: orders[0]?.currencyCode,
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error generating sales summary: ${(error as Error).message}`,
        },
      ],
    };
  }
}
