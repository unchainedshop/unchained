import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';

const OrderStatusEnum = z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']);
const PaymentProviderTypeEnum = z.enum(['CARD', 'INVOICE', 'GENERIC']);
const DeliveryProviderTypeEnum = z.enum(['PICKUP', 'SHIPPING', 'LOCAL']);
const SortDirectionEnum = z.enum(['ASC', 'DESC']);

const SortOptionInput = z.object({
  key: z.string().min(1).describe('Field to sort by'),
  value: SortDirectionEnum.describe('Sort direction'),
});

const DateFilterInput = z.object({
  from: z.string().datetime().optional().describe('Start date (ISO format)'),
  to: z.string().datetime().optional().describe('End date (ISO format)'),
});

export const OrdersListSchema = {
  limit: z.number().int().min(1).max(100).default(10).describe('Number of orders to return'),
  offset: z.number().int().min(0).default(0).describe('Number of orders to skip'),
  includeCarts: z.boolean().default(false).describe('Include cart-like (unsubmitted) orders'),
  queryString: z.string().optional().describe('Free-text search string'),
  status: z.array(OrderStatusEnum).optional().describe('Filter by order statuses'),
  sort: z.array(SortOptionInput).optional().describe('Sorting options'),
  paymentProviderTypes: z
    .array(PaymentProviderTypeEnum)
    .optional()
    .describe('Filter by payment provider types'),
  deliveryProviderTypes: z
    .array(DeliveryProviderTypeEnum)
    .optional()
    .describe('Filter by delivery provider types'),
  paymentProviderIds: z
    .array(z.string().min(1))
    .optional()
    .describe('Filter by specific payment provider IDs'),
  deliveryProviderIds: z
    .array(z.string().min(1))
    .optional()
    .describe('Filter by specific delivery provider IDs'),
  dateRange: DateFilterInput.optional().describe('Filter by creation date range'),
};

export const OrdersListZodSchema = z.object(OrdersListSchema);
export type OrdersListParams = z.infer<typeof OrdersListZodSchema>;

export async function ordersListHandler(context: Context, params: OrdersListParams) {
  const { modules, userId } = context;

  try {
    log('handler ordersListHandler', { userId, params });

    const {
      limit,
      offset,
      paymentProviderTypes,
      deliveryProviderTypes,
      paymentProviderIds: directPaymentProviderIds,
      deliveryProviderIds: directDeliveryProviderIds,
      ...restParams
    } = params;

    log(`query orders: ${limit} ${offset} ${restParams?.queryString || ''}`, { userId });

    const paymentProviderIds = directPaymentProviderIds ?? [];
    const deliveryProviderIds = directDeliveryProviderIds ?? [];

    const promises: Promise<any>[] = [];

    if (paymentProviderTypes?.length) {
      promises.push(
        modules.payment.paymentProviders
          .findProviders({ type: { $in: paymentProviderTypes as PaymentProviderType[] } })
          .then((providers) => {
            paymentProviderIds.push(...providers.map((p) => p._id));
          }),
      );
    }

    if (deliveryProviderTypes?.length) {
      promises.push(
        modules.delivery
          .findProviders({ type: { $in: deliveryProviderTypes as DeliveryProviderType[] } })
          .then((providers) => {
            deliveryProviderIds.push(...providers.map((p) => p._id));
          }),
      );
    }

    await Promise.all(promises);

    const [orderPayments, orderDeliveries] = await Promise.all([
      paymentProviderIds
        ? modules.orders.payments.findOrderPaymentsByProviderIds({ paymentProviderIds })
        : [],
      deliveryProviderIds
        ? modules.orders.deliveries.findDeliveryByProvidersId({ deliveryProviderIds })
        : [],
    ]);

    if (
      (paymentProviderIds.length && !orderPayments.length) ||
      (deliveryProviderIds.length && !orderDeliveries.length)
    ) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ orders: [] }),
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

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ orders }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error fetching orders: ${(error as Error).message}`,
        },
      ],
    };
  }
}
