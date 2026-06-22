import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  disconnect,
  runWorkToCompletion,
} from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';

let graphqlFetchAsAdmin;
let db;

const ONE_HOUR_FROM_NOW = new Date(Date.now() + 3600000);

test.describe('Zombie Killer — unreferenced file cleanup', () => {
  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test('reaps orphaned media files but spares in-progress uploads and linked files', async () => {
    // In-progress signed-URL upload: a file in a media path with an open `expires` ticket and
    // no link document yet (the client has not called confirmMediaUpload). Must be preserved.
    const pendingFileId = 'pending-upload-1';
    await db.collection('media_objects').insertOne({
      _id: pendingFileId,
      path: 'product-media',
      name: 'pending.png',
      expires: ONE_HOUR_FROM_NOW,
      created: new Date(),
    });

    // Genuinely orphaned file: committed (no `expires`) and no link document. Must be removed.
    const orphanFileId = 'orphan-media-1';
    await db.collection('media_objects').insertOne({
      _id: orphanFileId,
      path: 'product-media',
      name: 'orphan.png',
      created: new Date(),
    });

    // Linked file: committed (no `expires`) and referenced by a product_media link. Must survive.
    const linkedFileId = 'linked-media-1';
    await db.collection('media_objects').insertOne({
      _id: linkedFileId,
      path: 'product-media',
      name: 'linked.png',
      created: new Date(),
    });
    await db.collection('product_media').insertOne({
      _id: 'product-media-link-1',
      productId: 'simpleproduct',
      mediaId: linkedFileId,
      sortKey: 0,
      tags: [],
      created: new Date(),
    });

    const status = await runWorkToCompletion(graphqlFetchAsAdmin, 'ZOMBIE_KILLER');
    assert.strictEqual(status, 'SUCCESS');

    // In-progress upload is left alone (the TTL index on `expires` reaps it if abandoned).
    assert.ok(await db.collection('media_objects').findOne({ _id: pendingFileId }));
    // Orphaned committed file is removed.
    assert.strictEqual(await db.collection('media_objects').findOne({ _id: orphanFileId }), null);
    // Linked file survives.
    assert.ok(await db.collection('media_objects').findOne({ _id: linkedFileId }));
  });
});
