import { describe, it } from 'node:test';
import assert from 'node:assert';
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
});
