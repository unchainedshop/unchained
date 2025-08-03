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
    limit: z.number().int().min(1).max(100).default(10),
    offset: z.number().int().min(0).default(0),
    includeCarts: z.boolean().default(false),
    queryString: z.string().optional(),
    status: z.array(OrderStatusEnum).optional(),
    sort: z.array(SortOptionInput).optional(),
    paymentProviderTypes: z.array(PaymentProviderTypeEnum).optional(),
    deliveryProviderTypes: z.array(DeliveryProviderTypeEnum).optional(),
    paymentProviderIds: z.array(z.string().min(1)).optional(),
    deliveryProviderIds: z.array(z.string().min(1)).optional(),
    dateRange: DateFilterInput.optional(),
};

export const OrdersListZodSchema = z.object(OrdersListSchema);
export type OrdersListParams = z.infer<typeof OrdersListZodSchema>;

export async function ordersListHandler(context: Context, params: OrdersListParams) {
    const { modules, userId } = context;

    try {
        log('handler ordersListHandler', { userId, params });

        const {
            paymentProviderTypes,
            deliveryProviderTypes,
            paymentProviderIds = [],
            deliveryProviderIds = [],
            ...restParams
        } = params;

        const resolvedPaymentProviderIds = new Set(paymentProviderIds);
        const resolvedDeliveryProviderIds = new Set(deliveryProviderIds);

        const lookups: Promise<void>[] = [];

        if (paymentProviderTypes?.length) {
            lookups.push(
                modules.payment.paymentProviders
                    .findProviders({ type: { $in: paymentProviderTypes as PaymentProviderType[] } })
                    .then((providers) => {
                        providers.forEach((p) => resolvedPaymentProviderIds.add(p._id));
                    }),
            );
        }

        if (deliveryProviderTypes?.length) {
            lookups.push(
                modules.delivery
                    .findProviders({ type: { $in: deliveryProviderTypes as DeliveryProviderType[] } })
                    .then((providers) => {
                        providers.forEach((p) => resolvedDeliveryProviderIds.add(p._id));
                    }),
            );
        }

        await Promise.all(lookups);

        const [orderPayments, orderDeliveries] = await Promise.all([
            resolvedPaymentProviderIds.size
                ? modules.orders.payments.findOrderPaymentsByProviderIds({
                    paymentProviderIds: [...resolvedPaymentProviderIds],
                })
                : [],
            resolvedDeliveryProviderIds.size
                ? modules.orders.deliveries.findDeliveryByProvidersId({
                    deliveryProviderIds: [...resolvedDeliveryProviderIds],
                })
                : [],
        ]);

        if (
            (resolvedPaymentProviderIds.size > 0 && orderPayments.length === 0) ||
            (resolvedDeliveryProviderIds.size > 0 && orderDeliveries.length === 0)
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
