import { createHmac } from 'node:crypto';
import { OrderPricingSheet } from '@unchainedshop/core';
import { OrderStatus, type Order } from '@unchainedshop/core-orders';
import { subscribe, type RawPayloadType } from '@unchainedshop/events';
import { createLogger } from '@unchainedshop/logger';
import { acpConfig } from './config.ts';

const logger = createLogger('unchained:api:acp-webhook');
let configured = false;
const recentlyDelivered = new Map<string, number>();

export const signACPWebhookPayload = (
  rawBody: string,
  secret: string,
  timestamp = Math.floor(Date.now() / 1000),
) => {
  const signature = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  return `t=${timestamp},v1=${signature}`;
};

const orderStatus = (order: Order) => {
  if (order.context?.acp?.canceled || order.status === OrderStatus.REJECTED) return 'canceled';
  if (order.status === OrderStatus.FULFILLED) return 'completed';
  if (order.status === OrderStatus.CONFIRMED) return 'confirmed';
  if (order.status === OrderStatus.PENDING) return 'processing';
  return 'created';
};

const serializeOrder = async (order: Order) => {
  const pricing = OrderPricingSheet({
    calculation: order.calculation,
    currencyCode: order.currencyCode,
  });
  const permalinkBase = acpConfig.continueUrl?.replace(/\/$/, '');

  return {
    type: 'order',
    id: order._id,
    checkout_session_id: order._id,
    order_number: order.orderNumber,
    permalink_url: permalinkBase
      ? `${permalinkBase}/${order.orderNumber || order._id}`
      : `https://example.invalid/orders/${order.orderNumber || order._id}`,
    status: orderStatus(order),
    totals: [
      {
        type: 'total',
        display_text: 'Total',
        amount: pricing.total({ useNetPrice: false }).amount,
      },
    ],
  };
};

const eventName = (created: boolean) => {
  if (acpConfig.webhookEventTense === 'present') {
    return created ? 'order_create' : 'order_update';
  }
  return created ? 'order_created' : 'order_updated';
};

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const sendWebhook = async (order: Order, created: boolean) => {
  if (!acpConfig.webhookUrl || !acpConfig.webhookSecret) return;

  const rawBody = JSON.stringify({
    type: eventName(created),
    data: await serializeOrder(order),
  });

  for (let attempt = 0; attempt <= acpConfig.webhookRetries; attempt += 1) {
    try {
      const response = await fetch(acpConfig.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Merchant-Signature': signACPWebhookPayload(rawBody, acpConfig.webhookSecret),
          'Request-Id': crypto.randomUUID(),
        },
        body: rawBody,
      });
      if (response.ok) return;
      throw new Error(`Webhook receiver returned HTTP ${response.status}`);
    } catch (error) {
      if (attempt === acpConfig.webhookRetries) {
        logger.error(`ACP webhook delivery failed: ${error}`);
        return;
      }
      await wait(Math.min(1000 * 2 ** attempt, 30000));
    }
  }
};

export const configureACPWebhooks = () => {
  if (configured || !acpConfig.webhookUrl || !acpConfig.webhookSecret) {
    return;
  }
  configured = true;

  const register = (name: string, created: boolean) => {
    subscribe(name, async ({ payload }: RawPayloadType<{ order: Order }>) => {
      if (!payload.order?.context?.acp) return;
      const dedupeKey = `${name}:${payload.order._id}:${payload.order.status}`;
      const lastDelivered = recentlyDelivered.get(dedupeKey);
      if (lastDelivered && Date.now() - lastDelivered < 60_000) return;
      recentlyDelivered.set(dedupeKey, Date.now());
      await sendWebhook(payload.order, created);
    });
  };

  register('ORDER_CHECKOUT', true);
  register('ORDER_CONFIRMED', false);
  register('ORDER_FULFILLED', false);
  register('ORDER_REJECTED', false);
};
