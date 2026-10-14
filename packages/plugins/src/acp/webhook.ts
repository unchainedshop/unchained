import { createHmac } from 'node:crypto';
import { setTimeout as wait } from 'node:timers/promises';
import type { Order } from '@unchainedshop/core-orders';
import { subscribe } from '@unchainedshop/events';
import { createLogger } from '@unchainedshop/logger';
import { acpConfig } from './config.ts';
import { acpContextOf, serializeACPOrder } from './order.ts';

const logger = createLogger('unchained:acp:webhook');
let configured = false;
const deliveriesByOrder = new Map<string, Promise<void>>();

export const signACPWebhookPayload = (
  rawBody: string,
  secret: string,
  timestamp = Math.floor(Date.now() / 1000),
) => {
  const signature = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  return `t=${timestamp},v1=${signature}`;
};

const sendWebhook = async (order: Order, created: boolean) => {
  if (!acpConfig.webhookUrl || !acpConfig.webhookSecret) return;

  const rawBody = JSON.stringify({
    type: created ? 'order_create' : 'order_update',
    data: serializeACPOrder(order),
  });

  for (let attempt = 0; attempt <= acpConfig.webhookRetries; attempt += 1) {
    try {
      const response = await fetch(acpConfig.webhookUrl, {
        method: 'POST',
        signal: AbortSignal.timeout(10_000),
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

export const deliverACPWebhook = async (order: Order, created: boolean) => {
  const previousDelivery = deliveriesByOrder.get(order._id);
  const delivery = (async () => {
    await previousDelivery;
    try {
      await sendWebhook(order, created);
    } catch (error) {
      logger.error(`ACP webhook could not be sent: ${error}`);
    }
  })();
  deliveriesByOrder.set(order._id, delivery);
  await delivery;
  if (deliveriesByOrder.get(order._id) === delivery) deliveriesByOrder.delete(order._id);
};

export const configureACPWebhooks = () => {
  if (configured || !acpConfig.webhookUrl || !acpConfig.webhookSecret) {
    return;
  }
  configured = true;

  const register = (name: string, created: boolean) => {
    subscribe(name, async ({ payload }: any) => {
      const order: Order | undefined = payload?.order;
      if (!order || !acpContextOf(order)) return;
      await deliverACPWebhook(order, created);
    });
  };

  register('ORDER_CHECKOUT', true);
  register('ORDER_CONFIRMED', false);
  register('ORDER_FULFILLED', false);
  register('ORDER_REJECTED', false);
};
