import { createHash } from 'node:crypto';
import { WorkerAdapter, type IWorkerAdapter, type UnchainedCore } from '@unchainedshop/core';
import type { Order, OrderDelivery } from '@unchainedshop/core-orders';
import { subscribe } from '@unchainedshop/events';
import { createLogger } from '@unchainedshop/logger';
import { systemLocale } from '@unchainedshop/utils';
import { rootUrl } from './handoff.ts';
import { serializeOrder } from './order.ts';
import { guardedRequest, type UcpPluginOptions } from './platform.ts';
import { signingKey, signRequest } from './signature.ts';

const logger = createLogger('unchained:ucp');

export const UCP_WEBHOOK = 'UCP_WEBHOOK';

const ORDER_EVENTS = [
  'ORDER_CHECKOUT',
  'ORDER_CONFIRMED',
  'ORDER_REJECTED',
  'ORDER_FULFILLED',
  'ORDER_DELIVER',
];

interface WebhookInput {
  url: string;
  body: string;
  webhookId: string;
  timestamp: number;
}

export const webhookId = (orderId: string, event: string) => {
  const hex = createHash('sha256').update(`${orderId}:${event}`).digest('hex');
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

export function subscribeOrderWebhooks(unchainedAPI: UnchainedCore, options: UcpPluginOptions) {
  for (const event of ORDER_EVENTS) {
    subscribe<{ order?: Order; orderDelivery?: OrderDelivery }>(event, async ({ payload }) => {
      try {
        const order =
          payload.order ??
          (await unchainedAPI.modules.orders.findOrder({ orderId: payload.orderDelivery!.orderId }));
        const url = order?.context?.ucp?.webhookUrl;
        if (!url || !signingKey()) return;
        const id = webhookId(order._id, event);
        const body = JSON.stringify(
          await serializeOrder({ ...unchainedAPI, locale: systemLocale }, order, options),
        );
        await unchainedAPI.modules.worker.addWorkIfNotExists(
          {
            type: UCP_WEBHOOK,
            input: { url, body, webhookId: id, timestamp: Math.floor(Date.now() / 1000) },
            retries: 10,
          },
          (work) => work.input?.webhookId === id,
        );
      } catch (error) {
        logger.error(`UCP webhook ${event} not queued: ${error.message}`);
      }
    });
  }
}

export const UcpWebhookWorker: IWorkerAdapter<WebhookInput, { status: number }> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.ucp-webhook',
  label: 'Send signed UCP order webhooks, any 2xx is a success',
  version: '1.0.0',
  type: UCP_WEBHOOK,

  async doWork({ url, body, webhookId: id, timestamp }) {
    try {
      const headers = signRequest({
        method: 'POST',
        url,
        body,
        headers: {
          'content-type': 'application/json',
          'ucp-agent': `profile="${rootUrl()}/.well-known/ucp"`,
          'webhook-id': id,
          'webhook-timestamp': String(timestamp),
        },
      });
      const { status } = await guardedRequest(url, {
        method: 'POST',
        headers,
        body,
        maxBytes: 64 * 1024,
      });
      return { success: status >= 200 && status < 300, result: { status } };
    } catch (error) {
      return { success: false, error: { name: error.name, message: error.message } };
    }
  },
};
