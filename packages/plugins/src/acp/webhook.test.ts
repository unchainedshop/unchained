import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createHmac } from 'node:crypto';
import { signACPWebhookPayload } from './webhook.ts';

describe('ACP webhook signature', () => {
  it('produces t=<ts>,v1=<hmac-sha256(ts.rawBody)> (Merchant-Signature)', () => {
    const rawBody = '{"type":"order_created"}';
    const sig = signACPWebhookPayload(rawBody, 'shared-secret', 1_700_000_000);
    const expected = createHmac('sha256', 'shared-secret').update(`1700000000.${rawBody}`).digest('hex');
    assert.equal(sig, `t=1700000000,v1=${expected}`);
  });
});
