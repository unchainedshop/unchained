import assert from 'node:assert';
import test from 'node:test';
import { ACPError } from './error.ts';
import { withIdempotency } from './idempotency.ts';

test('replays a response for canonically equal request bodies', async () => {
  const key = crypto.randomUUID();
  let calls = 0;
  const execute = async () => {
    calls += 1;
    return { status: 201, body: { id: 'session-1' } };
  };

  const first = await withIdempotency('create', key, { a: 1, b: { c: 2 } }, execute);
  const replay = await withIdempotency('create', key, { b: { c: 2 }, a: 1 }, execute);

  assert.strictEqual(first.replayed, false);
  assert.strictEqual(replay.replayed, true);
  assert.deepStrictEqual(replay.body, { id: 'session-1' });
  assert.strictEqual(calls, 1);
});

test('rejects reuse with a different request body', async () => {
  const key = crypto.randomUUID();
  await withIdempotency('update', key, { quantity: 1 }, async () => ({
    status: 200,
    body: {},
  }));

  await assert.rejects(
    withIdempotency('update', key, { quantity: 2 }, async () => ({
      status: 200,
      body: {},
    })),
    (error: ACPError) => error.code === 'idempotency_conflict',
  );
});

test('rejects a duplicate request while the first request is in flight', async () => {
  const key = crypto.randomUUID();
  let resolve;
  const pending = new Promise<{ status: number; body: unknown }>((done) => {
    resolve = done;
  });
  const first = withIdempotency('complete', key, {}, () => pending);

  await assert.rejects(
    withIdempotency('complete', key, {}, async () => ({ status: 200, body: {} })),
    (error: ACPError) => error.code === 'idempotency_in_flight',
  );

  resolve({ status: 200, body: {} });
  await first;
});
