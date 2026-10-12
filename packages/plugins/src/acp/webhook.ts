import { createHmac } from 'node:crypto';
import { setTimeout as wait } from 'node:timers/promises';
import type { Order } from '@unchainedshop/core-orders';
import { subscribe } from '@unchainedshop/events';
import { createLogger } from '@unchainedshop/logger';
import { acpConfig } from './config.ts';
import { acpContextOf, serializeACPOrder } from './order.ts';

const logger = createLogger('unchained:acp:webhook');
let configured = false;
const DEDUPE_WINDOW = 60_000;
const recentlyDelivered = new Map<string, number>();

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

export const configureACPWebhooks = () => {
  if (configured || !acpConfig.webhookUrl || !acpConfig.webhookSecret) {
    return;
  }
  configured = true;

  const register = (name: string, created: boolean) => {
    subscribe(name, async ({ payload }: any) => {
      const order: Order | undefined = payload?.order;
      if (!order || !acpContextOf(order)) return;
      const now = Date.now();
      for (const [key, deliveredAt] of recentlyDelivered) {
        if (now - deliveredAt >= DEDUPE_WINDOW) recentlyDelivered.delete(key);
      }
      const dedupeKey = `${name}:${order._id}:${order.status}`;
      const lastDelivered = recentlyDelivered.get(dedupeKey);
      if (lastDelivered && now - lastDelivered < DEDUPE_WINDOW) return;
      recentlyDelivered.set(dedupeKey, now);
      await sendWebhook(order, created);
    });
  };

  register('ORDER_CHECKOUT', true);
  register('ORDER_CONFIRMED', false);
  register('ORDER_FULFILLED', false);
  register('ORDER_REJECTED', false);
};
