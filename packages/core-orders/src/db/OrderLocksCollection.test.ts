import { describe, it } from 'node:test';
import assert from 'node:assert';
import { acquireLock, type OrderLock } from './OrderLocksCollection.ts';
import type { mongodb } from '@unchainedshop/mongodb';

const duplicateKeyError = () => Object.assign(new Error('E11000 duplicate key'), { code: 11000 });

// Simulates the unique-index contention behavior of the real collection: a live
// lock makes updateOne throw E11000, an expired or absent one lets it through.
const buildCollectionStub = () => {
  const state: { current: OrderLock | null } = {
    current: null,
  };
  const collection = {
    updateOne: async (_filter, update: { $set: OrderLock }) => {
      if (state.current && state.current.expireAt > new Date()) throw duplicateKeyError();
      state.current = update.$set;
      return { acknowledged: true };
    },
    deleteOne: async (filter: mongodb.Filter<OrderLock>) => {
      if (
        state.current &&
        state.current.uniqueValue === filter.uniqueValue &&
        state.current.expireAt > new Date()
      ) {
        state.current = null;
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    },
  } as unknown as mongodb.Collection<OrderLock>;
  return { collection, state };
};

describe('acquireLock', () => {
  it('acquires a free lock and releases it', async () => {
    const { collection, state } = buildCollectionStub();
    const lock = await acquireLock(collection, 'order:checkout:1', 5000);
    assert.ok(state.current);
    await lock.release();
    assert.strictEqual(state.current, null);
  });

  it('two concurrent acquires on the same key: one wins, the other waits for release', async () => {
    const { collection, state } = buildCollectionStub();
    const first = await acquireLock(collection, 'order:checkout:1', 5000);
    const second = acquireLock(collection, 'order:checkout:1', 5000);
    // give the second acquire one contention round before releasing
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.ok(state.current, 'first still holds the lock');
    await first.release();
    const secondLock = await second;
    assert.ok(state.current, 'second now holds the lock');
    await secondLock.release();
    assert.strictEqual(state.current, null);
  });

  it('takes over an expired lock', async () => {
    const { collection, state } = buildCollectionStub();
    state.current = {
      key: 'order:checkout:1',
      uniqueValue: 'stale',
      expireAt: new Date(Date.now() - 1000),
    };
    const lock = await acquireLock(collection, 'order:checkout:1', 5000);
    assert.notStrictEqual(state.current?.uniqueValue, 'stale');
    await lock.release();
  });

  it('gives up with an error after retries against a held lock', async () => {
    const { collection, state } = buildCollectionStub();
    state.current = {
      key: 'order:checkout:1',
      uniqueValue: 'held',
      expireAt: new Date(Date.now() + 60000),
    };
    await assert.rejects(
      acquireLock(collection, 'order:checkout:1', 100),
      /Could not acquire lock order:checkout:1/,
    );
  });

  it('release does not delete a lock somebody else took over, and never throws', async () => {
    const { collection, state } = buildCollectionStub();
    const lock = await acquireLock(collection, 'order:checkout:1', 5000);
    // somebody else took the lock over after our ttl expired
    state.current = {
      key: 'order:checkout:1',
      uniqueValue: 'other-owner',
      expireAt: new Date(Date.now() + 60000),
    };
    await lock.release();
    assert.strictEqual(state.current?.uniqueValue, 'other-owner');

    collection.deleteOne = async () => {
      throw new Error('connection lost');
    };
    await assert.doesNotReject(lock.release());
  });

  it('rethrows unexpected database errors instead of retrying', async () => {
    const { collection } = buildCollectionStub();
    collection.updateOne = async () => {
      throw new Error('not authorized');
    };
    await assert.rejects(acquireLock(collection, 'order:checkout:1', 5000), /not authorized/);
  });
});
