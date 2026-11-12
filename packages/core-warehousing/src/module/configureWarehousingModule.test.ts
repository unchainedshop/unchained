import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, describe, it } from 'node:test';
import { MongoClient, type Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getEmitAdapter, setEmitAdapter, type EmitAdapter } from '@unchainedshop/events';
import type { TokenSurrogate } from '../db/TokenSurrogateCollection.ts';
import { configureWarehousingModule, type WarehousingModule } from './configureWarehousingModule.ts';

const token = (_id: string, productId: string, orderPositionId: string): TokenSurrogate => ({
  _id,
  userId: 'buyer',
  quantity: 1,
  tokenSerialNumber: _id,
  productId,
  orderPositionId,
  meta: {},
});

describe('createTokens', () => {
  let server: MongoMemoryServer | undefined;
  let client: MongoClient;
  let db: Db;
  let warehousing: WarehousingModule;
  let emitAdapter: EmitAdapter;
  // Each emitted token, with whether it was stored when it was emitted
  let emitted: { token: TokenSurrogate; stored: Promise<number> }[];

  before(async () => {
    // Use MONGO_URL (npm test shares the run's MongoDB), else start a server of its own
    server = process.env.MONGO_URL ? undefined : await MongoMemoryServer.create();
    client = await MongoClient.connect(process.env.MONGO_URL || server.getUri());
    db = client.db('warehousing-module-test');
    warehousing = await configureWarehousingModule({ db, migrationRepository: undefined as any });
    emitAdapter = getEmitAdapter();
    setEmitAdapter({
      publish(eventName, { payload }) {
        if (eventName !== 'TOKEN_CREATED') return;
        emitted.push({
          token: payload.token,
          stored: db.collection('token_surrogates').countDocuments({ _id: payload.token._id }),
        });
      },
      subscribe: () => undefined,
    });
  });

  beforeEach(async () => {
    emitted = [];
    await db.collection('token_surrogates').deleteMany({});
  });

  afterEach(async () => {
    await Promise.all(emitted.map(({ stored }) => stored));
  });

  after(async () => {
    setEmitAdapter(emitAdapter);
    await client?.close();
    await server?.stop();
  });

  it('emits TOKEN_CREATED for each token once the tokens are stored', async () => {
    const tokens = [
      token('t1', 'product-a', 'position-1'),
      token('t2', 'product-a', 'position-1'),
      token('t3', 'product-b', 'position-2'),
    ];
    await warehousing.createTokens(tokens);

    assert.deepEqual(
      emitted.map(({ token }) => token),
      tokens,
    );
    assert.deepEqual(await Promise.all(emitted.map(({ stored }) => stored)), [1, 1, 1]);
  });

  it('emits nothing when the insert fails', async () => {
    await warehousing.createTokens([token('t1', 'product-a', 'position-1')]);

    await assert.rejects(() => warehousing.createTokens([token('t1', 'product-a', 'position-1')]), {
      code: 11000,
    });
    assert.equal(emitted.length, 1);
  });
});
