import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { setTimeout as sleep } from 'node:timers/promises';

export interface OrderLock {
  key: string;
  uniqueValue: string;
  expireAt: Date;
}

const DUPLICATE_KEY = 11000;
const LOCK_WAIT_MS = 2000;
const LOCK_RETRY_DELAY_MS = 50;

export const OrderLocksCollection = async (db: mongodb.Db) => {
  // Keep the established collection name so existing deployments retain their locks.
  const OrderLocks = db.collection<OrderLock>('locco-locks');

  // The unique index is what makes acquireLock mutually exclusive, so it is
  // fail-closed: refuse to boot rather than hand out locks that do not lock.
  // rebuild:false so a transient error can never drop the existing unique
  // index out from under concurrently running instances.
  const success = await buildDbIndexes<OrderLock>(
    OrderLocks,
    [
      { index: { key: 1 }, options: { unique: true } },
      { index: { expireAt: 1 }, options: { expireAfterSeconds: 0 } },
    ],
    { rebuild: false },
  );
  if (!success) {
    throw new Error('Could not ensure the unique index backing order locks, refusing to start');
  }

  return OrderLocks;
};

/**
 * Acquires a distributed, MongoDB-backed lock. Correctness rests on the unique
 * index on `key` combined with upsert-only-when-expired: a live lock makes the
 * filter match nothing, the upsert then collides on the index, and the E11000
 * error is treated as contention worth retrying. The TTL index is garbage
 * collection only — expiry is enforced by the `expireAt` conditions. The lease
 * is renewed until release, so `ttl` only bounds how long a holder that stopped
 * renewing, e.g. a crashed process, blocks others.
 */
export const acquireLock = async (
  OrderLocks: mongodb.Collection<OrderLock>,
  key: string,
  ttl: number,
) => {
  const uniqueValue = crypto.randomUUID();
  const waitUntil = Date.now() + LOCK_WAIT_MS;
  while (true) {
    try {
      await OrderLocks.updateOne(
        { key, expireAt: { $lt: new Date() } },
        { $set: { key, uniqueValue, expireAt: new Date(Date.now() + ttl) } },
        { upsert: true },
      );
      break;
    } catch (error) {
      if ((error as { code?: number })?.code !== DUPLICATE_KEY) throw error;
    }
    if (Date.now() > waitUntil) throw new Error(`Could not acquire lock ${key}`, { cause: 'LOCKED' });
    await sleep(LOCK_RETRY_DELAY_MS * (0.5 + Math.random()));
  }
  const renewal = setInterval(async () => {
    try {
      const { matchedCount } = await OrderLocks.updateOne(
        { key, uniqueValue },
        { $set: { expireAt: new Date(Date.now() + ttl) } },
      );
      if (!matchedCount) clearInterval(renewal);
    } catch {
      /**/
    }
  }, ttl / 3);
  renewal.unref?.();
  return {
    release: async () => {
      clearInterval(renewal);
      try {
        // Only our own, still-live lock: a lock taken over after expiry by
        // somebody else has a different uniqueValue and must survive.
        await OrderLocks.deleteOne({ key, uniqueValue, expireAt: { $gt: new Date() } });
      } catch {
        // Never throw: every call site releases inside a finally block and
        // a throwing release would mask the actual error.
      }
    },
  };
};
