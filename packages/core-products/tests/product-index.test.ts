import { after, before, describe, it } from 'node:test';
import assert from 'node:assert';
import type { Db } from 'mongodb';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ProductsCollection } from '../src/db/ProductsCollection.ts';

describe('product indexes', () => {
  let client: MongoClient;
  let db: Db;
  let server: MongoMemoryServer;

  before(async () => {
    server = await MongoMemoryServer.create({
      instance: { dbName: 'product-index-test', storageEngine: 'wiredTiger' },
    });
    client = new MongoClient(server.getUri());
    await client.connect();
    db = client.db('product-index-test');
    await ProductsCollection(db);
  });

  after(async () => {
    await client?.close();
    await server?.stop();
  });

  it('builds an index matching the default status and publication sort', async () => {
    const indexes = await db.collection('products').listIndexes().toArray();
    const defaultListIndex = indexes.find(({ name }) => name === 'status_1_sequence_1_published_-1');

    assert.ok(defaultListIndex);
  });

  it('builds sparse indexes for reverse bundle and proxy references', async () => {
    const indexes = await db.collection('products').listIndexes().toArray();
    const bundleIndex = indexes.find(({ name }) => name === 'bundleItems.productId_1');
    const proxyIndex = indexes.find(({ name }) => name === 'proxy.assignments.productId_1');

    assert.strictEqual(bundleIndex?.sparse, true);
    assert.strictEqual(proxyIndex?.sparse, true);
  });
});
