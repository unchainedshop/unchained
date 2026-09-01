import { after, before, describe, it } from 'node:test';
import assert from 'node:assert';
import type { Db } from 'mongodb';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AssortmentsCollection } from './AssortmentsCollection.ts';

describe('assortment indexes', () => {
  let client: MongoClient;
  let db: Db;
  let server: MongoMemoryServer;

  before(async () => {
    server = await MongoMemoryServer.create({
      instance: { dbName: 'assortment-index-test', storageEngine: 'wiredTiger' },
    });
    client = new MongoClient(server.getUri());
    await client.connect();
    db = client.db('assortment-index-test');
    await AssortmentsCollection(db);
  });

  after(async () => {
    await client?.close();
    await server?.stop();
  });

  it('builds an index matching exact assortment-product lookups', async () => {
    const indexes = await db.collection('assortment_products').listIndexes().toArray();
    const exactPairIndex = indexes.find(({ name }) => name === 'assortmentId_1_productId_1');

    assert.ok(exactPairIndex);
  });

  it('builds an index matching child-link traversal ordering', async () => {
    const indexes = await db.collection('assortment_links').listIndexes().toArray();
    const childTraversalIndex = indexes.find(
      ({ name }) => name === 'childAssortmentId_1_sortKey_1_parentAssortmentId_1',
    );

    assert.ok(childTraversalIndex);
  });
});
