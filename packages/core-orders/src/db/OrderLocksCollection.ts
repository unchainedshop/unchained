import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { setTimeout as sleep } from 'node:timers/promises';

export interface OrderLock {
  key: string;
  uniqueValue: string;
  expireAt: Date;
}

const DUPLICATE_KEY = 11000;
const LOCK_RETRIES = 10;
const LOCK_RETRY_DELAY_MS = 200;

export const OrderLocksCollection = async (db: mongodb.Db) => {
  // Same collection name the previously used lock library wrote to, so existing
  // deployments need no migration (stale rows are TTL-cleaned within seconds).
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
 * collection only — expiry is enforced by the `expireAt` conditions.
 */
export const acquireLock = async (
  OrderLocks: mongodb.Collection<OrderLock>,
  key: string,
  ttl: number,
) => {
  const uniqueValue = crypto.randomUUID();
  for (let attempt = 0; attempt < LOCK_RETRIES; attempt += 1) {
    try {
      await OrderLocks.updateOne(
        { key, expireAt: { $lt: new Date() } },
        { $set: { key, uniqueValue, expireAt: new Date(Date.now() + ttl) } },
        { upsert: true },
      );
      return {
        release: async () => {
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
    } catch (error) {
      if ((error as { code?: number })?.code !== DUPLICATE_KEY) throw error;
      if (attempt < LOCK_RETRIES - 1) await sleep(LOCK_RETRY_DELAY_MS);
    }
  }
  throw new Error(`Could not acquire lock ${key}`);
};
