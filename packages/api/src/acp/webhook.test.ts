import assert from 'node:assert';
import test from 'node:test';
import { createHmac } from 'node:crypto';
import { signACPWebhookPayload } from './webhook.ts';

test('signs the exact webhook body with timestamp dot body', () => {
  const body = '{"type":"order_created","data":{"id":"order-1"}}';
  const secret = 'secret';
  const timestamp = 1710000000;
  const expected = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');

  assert.strictEqual(signACPWebhookPayload(body, secret, timestamp), `t=${timestamp},v1=${expected}`);
});
