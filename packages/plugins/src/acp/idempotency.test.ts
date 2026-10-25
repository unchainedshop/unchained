import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ACPError } from './error.ts';
import { withIdempotency } from './idempotency.ts';

describe('ACP idempotency', () => {
  it('replays the stored response for the same key + body (executes once)', async () => {
    let calls = 0;
    const exec = async () => {
      calls += 1;
      return { status: 200, body: { n: calls } };
    };
    const first = await withIdempotency('scope', 'key-1', { a: 1 }, exec);
    const second = await withIdempotency('scope', 'key-1', { a: 1 }, exec);
    assert.equal(calls, 1);
    assert.equal(first.replayed, false);
    assert.equal(second.replayed, true);
    assert.deepEqual((second as any).body, { n: 1 });
  });

  it('rejects the same key used with a different request body', async () => {
    await withIdempotency('scope', 'key-2', { a: 1 }, async () => ({ status: 200, body: {} }));
    await assert.rejects(
      () => withIdempotency('scope', 'key-2', { a: 2 }, async () => ({ status: 200, body: {} })),
      /different request body/,
    );
  });

  it('does not cache 5xx responses, so a retry re-executes', async () => {
    let calls = 0;
    const exec = async () => {
      calls += 1;
      return { status: 500, body: { calls } };
    };
    await withIdempotency('scope', 'key-3', {}, exec);
    await withIdempotency('scope', 'key-3', {}, exec);
    assert.equal(calls, 2);
  });

  it('returns a retry hint while the same request is in flight', async () => {
    let release!: () => void;
    const wait = new Promise<void>((resolve) => {
      release = resolve;
    });
    const first = withIdempotency('scope', 'key-in-flight', {}, async () => {
      await wait;
      return { status: 200, body: {} };
    });

    await assert.rejects(
      () => withIdempotency('scope', 'key-in-flight', {}, async () => ({ status: 200, body: {} })),
      (error: any) =>
        error.code === 'idempotency_in_flight' && error.options.headers['Retry-After'] === '1',
    );
    release();
    await first;
  });

  it('replays a business error and rejects another body for its key', async () => {
    let calls = 0;
    const exec = async () => {
      calls += 1;
      throw new ACPError(400, 'invalid_request', 'product_not_found', 'Product not found');
    };
    const first = await withIdempotency('scope', 'key-4xx', { a: 1 }, exec);
    const replay = await withIdempotency('scope', 'key-4xx', { a: 1 }, exec);
    assert.equal(calls, 1);
    assert.deepEqual(
      [first.status, replay.status, replay.replayed, (replay as any).body.code],
      [400, 400, true, 'product_not_found'],
    );
    await assert.rejects(
      () => withIdempotency('scope', 'key-4xx', { a: 2 }, exec),
      /different request body/,
    );
  });

  it('runs a request again after a retryable conflict', async () => {
    let calls = 0;
    const exec = async () => {
      calls += 1;
      throw new ACPError(409, 'invalid_request', 'session_in_progress', 'Busy');
    };
    await assert.rejects(() => withIdempotency('scope', 'key-409', {}, exec), { status: 409 });
    await assert.rejects(() => withIdempotency('scope', 'key-409', {}, exec), { status: 409 });
    assert.equal(calls, 2);
  });

  it('keeps unexpired responses at capacity and rejects new keys until they expire', async (t) => {
    t.mock.timers.enable({ apis: ['Date'], now: Date.now() });
    let calls = 0;
    const exec = async () => ({ status: 200, body: { calls: ++calls } });
    await withIdempotency('capacity', 'first', {}, exec);
    await assert.rejects(async () => {
      for (let index = 0; ; index += 1) await withIdempotency('capacity', `fill-${index}`, {}, exec);
    }, /at capacity/);

    assert.equal((await withIdempotency('capacity', 'first', {}, exec)).replayed, true);
    t.mock.timers.tick(24 * 60 * 60 * 1000);
    assert.equal((await withIdempotency('capacity', 'first', {}, exec)).replayed, false);
  });
});
