import { after, before, describe, it } from 'node:test';
import assert from 'node:assert';
import { promisify } from 'node:util';
import type { Db } from 'mongodb';
import { initDb, stopDb } from '@unchainedshop/mongodb';
import MongoStore from './mongo-store.ts';

const fastifySession = (generation: string, data: Record<string, unknown> = {}): any => ({
  __fastifySessionMetadata: { generation },
  ...data,
});

describe('MongoStore.compareAndSet', () => {
  let db: Db;
  let set: (sid: string, session: any) => Promise<void>;
  let get: (sid: string) => Promise<any>;
  let compareAndSet: (sid: string, expectedGeneration: string, session: any) => Promise<void>;

  before(async () => {
    db = await initDb({ forceInMemory: true, port: 0 });
    const store = MongoStore.create({ client: (db as any).client, dbName: db.databaseName });
    set = promisify(store.set).bind(store);
    get = promisify(store.get).bind(store);
    compareAndSet = promisify(store.compareAndSet).bind(store);
  });

  after(async () => {
    await stopDb();
  });

  it('updates a session that still has the expected generation', async () => {
    await set('current', fastifySession('current', { userId: 'user' }));
    await compareAndSet('current', 'current', fastifySession('regenerated', { userId: null }));
    assert.deepStrictEqual(await get('current'), fastifySession('regenerated', { userId: null }));
  });

  it('rejects a session that was regenerated in the meantime', async () => {
    await set('stale', fastifySession('newer', { userId: 'user' }));
    await assert.rejects(compareAndSet('stale', 'stale', fastifySession('stale')), { code: 'ENOENT' });
    assert.deepStrictEqual(await get('stale'), fastifySession('newer', { userId: 'user' }));
  });

  it('does not recreate a destroyed session', async () => {
    await assert.rejects(compareAndSet('destroyed', 'destroyed', fastifySession('destroyed')), {
      code: 'ENOENT',
    });
    assert.strictEqual(await get('destroyed'), null);
  });

  it('updates sessions stored before generations were tracked', async () => {
    await db.collection<{ _id: string }>('sessions').insertOne({
      _id: 'legacy',
      session: JSON.stringify({ userId: 'user' }),
      expires: new Date(Date.now() + 60_000),
    });
    await compareAndSet('legacy', 'legacy', fastifySession('legacy', { userId: null }));
    assert.deepStrictEqual(await get('legacy'), fastifySession('legacy', { userId: null }));
  });
});
