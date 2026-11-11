import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, describe, it } from 'node:test';
import { MongoClient, type Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getEmitAdapter, setEmitAdapter, type EmitAdapter } from '@unchainedshop/events';
import type { TokenSurrogate } from '../db/TokenSurrogateCollection.ts';
import {
  configureWarehousingModule,
  type TokensCreatedEventPayload,
  type WarehousingModule,
} from './configureWarehousingModule.ts';

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
  // Each emitted payload, with the number of its tokens stored when it was emitted
  let emitted: { payload: TokensCreatedEventPayload; stored: Promise<number> }[];

  before(async () => {
    // Use MONGO_URL (npm test shares the run's MongoDB), else start a server of its own
    server = process.env.MONGO_URL ? undefined : await MongoMemoryServer.create();
    client = await MongoClient.connect(process.env.MONGO_URL || server.getUri());
    db = client.db('warehousing-module-test');
    warehousing = await configureWarehousingModule({ db, migrationRepository: undefined as any });
    emitAdapter = getEmitAdapter();
    setEmitAdapter({
      publish(eventName, { payload }) {
        if (eventName !== 'TOKENS_CREATED') return;
        emitted.push({
          payload: payload as TokensCreatedEventPayload,
          stored: db.collection('token_surrogates').countDocuments({ _id: { $in: payload.tokenIds } }),
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

  it('emits TOKENS_CREATED once per call, after the tokens are stored, with ids only', async () => {
    await warehousing.createTokens([
      token('t1', 'product-a', 'position-1'),
      token('t2', 'product-a', 'position-1'),
      token('t3', 'product-b', 'position-2'),
    ]);

    assert.equal(emitted.length, 1);
    assert.deepEqual(emitted[0].payload, {
      tokenIds: ['t1', 't2', 't3'],
      productIds: ['product-a', 'product-b'],
      orderPositionIds: ['position-1', 'position-2'],
    });
    assert.equal(await emitted[0].stored, 3);

    await warehousing.createTokens([token('t4', 'product-a', 'position-3')]);
    assert.deepEqual(
      emitted.map(({ payload }) => payload.tokenIds),
      [['t1', 't2', 't3'], ['t4']],
    );
    assert.equal(await emitted[1].stored, 1);
  });

  it('emits nothing when the insert fails', async () => {
    await warehousing.createTokens([token('t1', 'product-a', 'position-1')]);

    await assert.rejects(() => warehousing.createTokens([token('t1', 'product-a', 'position-1')]), {
      code: 11000,
    });
    assert.equal(emitted.length, 1);
  });
});
