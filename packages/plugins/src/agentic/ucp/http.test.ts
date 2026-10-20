import assert from 'node:assert';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';
import { withIdempotency, type UcpRequest } from './http.ts';
import { protocolErrorResponse } from './protocol.ts';

const body = Buffer.from('{}');

const requestWith = (begin: () => Promise<unknown>) =>
  ({
    request: new Request('https://shop.example/ucp/checkout-sessions', {
      method: 'POST',
      headers: { 'idempotency-key': 'create-1' },
    }),
    profileUrl: 'https://agent.example/profile',
    context: { params: {}, modules: { ucp: { idempotency: { begin } } } },
  }) as unknown as UcpRequest;

const run = async () => ({ status: 201, body: {} });

describe('UCP idempotency', () => {
  it('fails closed with 503 when the idempotency store is unavailable', async () => {
    let failure: Error | undefined;
    try {
      await withIdempotency(
        requestWith(async () => {
          throw new Error('connection reset');
        }),
        'create',
        body,
        run,
      );
    } catch (error) {
      failure = error;
    }
    const response = protocolErrorResponse(failure!)!;
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('retry-after'), '1');
    assert.equal((await response.json()).code, 'idempotency_unavailable');
  });

  it('refuses a key reused for another body and a key still in flight', async () => {
    await assert.rejects(
      withIdempotency(
        requestWith(async () => ({ bodyHash: 'other' })),
        'create',
        body,
        run,
      ),
      { cause: 'idempotency_conflict' },
    );
    const bodyHash = createHash('sha256').update(body).digest('hex');
    await assert.rejects(
      withIdempotency(
        requestWith(async () => ({ bodyHash })),
        'create',
        body,
        run,
      ),
      { cause: 'request_in_progress' },
    );
  });
});
