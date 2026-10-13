import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createHmac } from 'node:crypto';
import type { Order } from '@unchainedshop/core-orders';
import { acpConfig } from './config.ts';
import { deliverACPWebhook, signACPWebhookPayload } from './webhook.ts';

const acpOrder = (status: string) =>
  ({ _id: 'order-id', status, currencyCode: 'CHF', calculation: [], context: { acp: {} } }) as Order;

const configureReceiver = (t, retries: number) => {
  t.mock.property(acpConfig, 'webhookUrl', 'https://agent.test/webhooks');
  t.mock.property(acpConfig, 'webhookSecret', 'shared-secret');
  t.mock.property(acpConfig, 'webhookRetries', retries);
};

describe('ACP webhook signature', () => {
  it('produces t=<ts>,v1=<hmac-sha256(ts.rawBody)> (Merchant-Signature)', () => {
    const rawBody = '{"type":"order_created"}';
    const sig = signACPWebhookPayload(rawBody, 'shared-secret', 1_700_000_000);
    const expected = createHmac('sha256', 'shared-secret').update(`1700000000.${rawBody}`).digest('hex');
    assert.equal(sig, `t=1700000000,v1=${expected}`);
  });
});

describe('ACP webhook delivery', () => {
  it('delivers the events of an order in order, also when the first one is retried', async (t) => {
    configureReceiver(t, 1);
    const received: string[] = [];
    let processingAttempts = 0;
    t.mock.method(globalThis, 'fetch', async (_url, { body }) => {
      const { data } = JSON.parse(body);
      if (data.status === 'processing' && processingAttempts++ === 0) {
        return new Response('', { status: 503 });
      }
      received.push(data.status);
      return new Response('', { status: 200 });
    });

    await Promise.all([
      deliverACPWebhook(acpOrder('PENDING'), true),
      deliverACPWebhook(acpOrder('CONFIRMED'), false),
    ]);

    assert.deepEqual(received, ['processing', 'confirmed']);
  });

  it('sends an event again after its delivery failed', async (t) => {
    configureReceiver(t, 0);
    let attempts = 0;
    t.mock.method(
      globalThis,
      'fetch',
      async () => new Response('', { status: ++attempts === 1 ? 503 : 200 }),
    );

    await deliverACPWebhook(acpOrder('PENDING'), true);
    await deliverACPWebhook(acpOrder('PENDING'), true);

    assert.equal(attempts, 2);
  });
});
