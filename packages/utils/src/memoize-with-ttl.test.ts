import { describe, it } from 'node:test';
import assert from 'node:assert';
import memoizeWithTTL from './memoize-with-ttl.ts';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('memoizeWithTTL', () => {
  it('shares one invocation between concurrent callers', async () => {
    let calls = 0;
    const memoized = memoizeWithTTL(
      async () => {
        calls += 1;
        await tick();
        return calls;
      },
      { ttl: 1000 },
    );

    const [a, b] = await Promise.all([memoized(), memoized()]);
    assert.strictEqual(a, 1);
    assert.strictEqual(b, 1);
    assert.strictEqual(calls, 1);
  });

  it('caches resolved null values', async () => {
    let calls = 0;
    const memoized = memoizeWithTTL(
      async () => {
        calls += 1;
        return null;
      },
      { ttl: 1000 },
    );

    assert.strictEqual(await memoized(), null);
    assert.strictEqual(await memoized(), null);
    assert.strictEqual(calls, 1);
  });

  it('expires entries after the ttl', async () => {
    let calls = 0;
    const memoized = memoizeWithTTL(
      async () => {
        calls += 1;
        return calls;
      },
      { ttl: 5 },
    );

    assert.strictEqual(await memoized(), 1);
    await sleep(10);
    assert.strictEqual(await memoized(), 2);
  });

  it('retries after a rejection instead of caching the failure', async () => {
    let calls = 0;
    const memoized = memoizeWithTTL(
      async () => {
        calls += 1;
        if (calls === 1) throw new Error('boom');
        return calls;
      },
      { ttl: 1000 },
    );

    await assert.rejects(memoized(), /boom/);
    assert.strictEqual(await memoized(), 2);
  });

  it('keys entries via cacheKey and supports targeted deletion', async () => {
    let calls = 0;
    const memoized = memoizeWithTTL(
      async (id: string, suffix = '') => {
        calls += 1;
        return `${id}${suffix}:${calls}`;
      },
      { ttl: 1000, cacheKey: ([id]) => id },
    );

    assert.strictEqual(await memoized('a'), 'a:1');
    // cache hit: the differing second argument is never evaluated
    assert.strictEqual(await memoized('a', '-ignored'), 'a:1');
    assert.strictEqual(await memoized('b'), 'b:2');

    memoized.delete('a');
    assert.strictEqual(await memoized('a'), 'a:3');
    assert.strictEqual(await memoized('b'), 'b:2');
  });

  it('clear() empties the whole cache', async () => {
    let calls = 0;
    const memoized = memoizeWithTTL(
      async () => {
        calls += 1;
        return calls;
      },
      { ttl: 1000 },
    );

    await memoized();
    memoized.clear();
    assert.strictEqual(await memoized(), 2);
  });

  it('shares an in-flight invocation even after the ttl has elapsed', async () => {
    let calls = 0;
    const memoized = memoizeWithTTL(
      async () => {
        calls += 1;
        await sleep(30);
        return calls;
      },
      { ttl: 1 },
    );

    const first = memoized();
    await sleep(10);
    // ttl is long gone, but the first invocation is still pending — join it
    const second = memoized();
    assert.strictEqual(await first, 1);
    assert.strictEqual(await second, 1);
    assert.strictEqual(calls, 1);
    // ttl counts from settlement, so immediately after resolution it still serves the hit
    assert.strictEqual(await memoized(), 1);
  });

  it('a slow failure does not evict a newer refresh', async () => {
    let rejectFirst: (reason: Error) => void;
    const first = new Promise<number>((_resolve, reject) => {
      rejectFirst = reject;
    });
    first.catch(() => undefined);
    let calls = 0;
    const memoized = memoizeWithTTL(
      async () => {
        calls += 1;
        if (calls === 1) return first;
        return calls;
      },
      { ttl: 1000 },
    );

    const pendingFirst = memoized();
    pendingFirst.catch(() => undefined);
    // an explicit eviction while the first call is still pending → fresh entry
    memoized.delete(undefined);
    assert.strictEqual(await memoized(), 2);
    // the old call now fails; the fresh entry must survive
    rejectFirst!(new Error('slow failure'));
    await tick();
    assert.strictEqual(await memoized(), 2);
  });
});
