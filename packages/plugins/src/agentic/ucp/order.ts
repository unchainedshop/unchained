import { DeliveryDirector } from '@unchainedshop/core';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { OrderDeliveryStatus, OrderStatus, type Order } from '@unchainedshop/core-orders';
import { orderUrl } from './handoff.ts';
import type { UcpRequest, UcpResult } from './http.ts';
import type { UcpPluginOptions } from './platform.ts';
import { ORDER, UCP_VERSION } from './protocol.ts';
import { deliveryOf, lineItemOf, toPostalAddress, totalsOf, type UcpApi } from './serialize.ts';
import { unrecoverable } from './status.ts';

const orderCapabilities = { [ORDER]: [{ version: UCP_VERSION }] };

export async function serializeOrder(api: UcpApi, order: Order, options: UcpPluginOptions) {
  const positions = await api.modules.orders.positions.findOrderPositions({ orderId: order._id });
  const lineItems = await Promise.all(positions.map((position) => lineItemOf(api, order, position)));
  const totals = await totalsOf(api, order, positions, lineItems);
  const { delivery, provider } = await deliveryOf(api, order);
  const pickup = provider?.type === DeliveryProviderType.PICKUP;
  const location =
    pickup && delivery?.context?.orderPickUpLocationId
      ? await (
          await DeliveryDirector.actions(provider, {}, api)
        ).pickUpLocationById(delivery.context.orderPickUpLocationId)
      : null;
  const rejected = order.status === OrderStatus.REJECTED;
  const delivered =
    !rejected &&
    (order.status === OrderStatus.FULFILLED || delivery?.status === OrderDeliveryStatus.DELIVERED);
  const items = positions.map(({ _id, quantity }) => ({ id: _id, quantity }));

  return {
    ucp: { version: UCP_VERSION, status: 'success', capabilities: orderCapabilities },
    id: order._id,
    ...(order.orderNumber ? { label: order.orderNumber } : {}),
    checkout_id: order._id,
    permalink_url: orderUrl(options, order),
    currency: order.currencyCode,
    line_items: lineItems.map(({ quantity, ...lineItem }) => {
      const total = rejected ? 0 : quantity;
      const fulfilled = delivered ? total : 0;
      return {
        ...lineItem,
        quantity: { original: quantity, total, fulfilled },
        status: total === 0 ? 'removed' : fulfilled === total ? 'fulfilled' : 'processing',
      };
    }),
    fulfillment: {
      expectations: items.length
        ? [
            {
              id: 'default',
              line_items: items,
              method_type: pickup ? 'pickup' : 'shipping',
              destination: toPostalAddress(pickup ? location?.address : delivery?.context?.address),
            },
          ]
        : [],
      events:
        delivered && delivery
          ? [
              {
                id: delivery._id,
                occurred_at: (delivery.delivered ?? order.fulfilled ?? new Date()).toISOString(),
                type: 'delivered',
                line_items: items,
              },
            ]
          : [],
    },
    adjustments: rejected
      ? [
          {
            id: `${order._id}-cancellation`,
            type: 'cancellation',
            occurred_at: (order.rejected ?? new Date()).toISOString(),
            status: 'completed',
            line_items: items.map(({ id, quantity }) => ({ id, quantity: -quantity })),
            totals: [{ type: 'total', amount: -totals.at(-1)!.amount }],
          },
        ]
      : [],
    totals,
  };
}

export async function getOrder({
  context,
  profileUrl,
  platform,
  options,
}: UcpRequest): Promise<UcpResult> {
  const order = await context.modules.orders.findOrder({ orderId: context.params.id });
  const messages = !platform
    ? [unrecoverable('unauthorized', 'Only registered platforms read orders')]
    : !order || order.status === null || order.context?.ucp?.platform !== profileUrl
      ? [unrecoverable('not_found', 'Order not found')]
      : null;
  if (messages) {
    return {
      status: 200,
      body: {
        ucp: { version: UCP_VERSION, status: 'error', capabilities: orderCapabilities },
        messages,
      },
    };
  }
  return { status: 200, body: await serializeOrder(context, order!, options) };
}
