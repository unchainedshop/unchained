import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  disconnect,
  getServerBaseUrl,
} from './helpers.js';
import { USER_TOKEN } from './seeds/users.js';

const prepareAvatarUpload = async (graphqlFetch, mediaName) => {
  const { data, errors } = await graphqlFetch({
    query: /* GraphQL */ `
      mutation prepareUserAvatarUpload($mediaName: String!) {
        prepareUserAvatarUpload(mediaName: $mediaName) {
          _id
          putURL
          expires
        }
      }
    `,
    variables: { mediaName },
  });
  assert.strictEqual(errors, undefined, JSON.stringify(errors));
  return data.prepareUserAvatarUpload;
};

test.describe('Media upload hardening', () => {
  let db;
  let graphqlFetch;

  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);
  });

  test.after(async () => {
    await disconnect();
  });

  test('a signed PUT URL cannot be used a second time once the file is linked', async () => {
    const { putURL } = await prepareAvatarUpload(graphqlFetch, 'reuse.png');

    const first = await fetch(putURL, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      body: 'first-upload',
    });
    assert.strictEqual(first.status, 200);

    const replay = await fetch(putURL, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/html' },
      body: '<script>replaced</script>',
    });
    assert.strictEqual(replay.status, 400);

    const { fileId } = await first.json();
    const file = await db.collection('media_objects').findOne({ _id: fileId });
    assert.strictEqual(file.type, 'image/png');
  });

  test('a signed PUT URL stops working after its expiry has passed', async () => {
    const { _id: fileId, putURL } = await prepareAvatarUpload(graphqlFetch, 'expired.png');

    const url = new URL(putURL);
    const expiry = Number(url.searchParams.get('e'));
    assert.ok(expiry > Date.now());

    // Move the signed deadline into the past without touching the signature.
    await db
      .collection('media_objects')
      .updateOne({ _id: fileId }, { $set: { expires: new Date(Date.now() - 1000) } });

    const expired = await fetch(putURL, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      body: 'too-late',
    });
    assert.strictEqual(expired.status, 403);
  });

  test('an uploaded HTML file is not served inline on the engine origin', async () => {
    const { putURL } = await prepareAvatarUpload(graphqlFetch, 'payload.html');
    const upload = await fetch(putURL, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/html' },
      body: '<script>alert(origin)</script>',
    });
    assert.strictEqual(upload.status, 200);
    const { fileId } = await upload.json();

    const file = await db.collection('media_objects').findOne({ _id: fileId });
    const response = await fetch(`${getServerBaseUrl()}${file.url}`);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers.get('content-disposition'), 'attachment');
    assert.strictEqual(response.headers.get('x-content-type-options'), 'nosniff');
    assert.match(response.headers.get('content-security-policy'), /sandbox/);
  });

  test('an uploaded image is still served inline', async () => {
    const { putURL } = await prepareAvatarUpload(graphqlFetch, 'avatar.png');
    const upload = await fetch(putURL, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      body: 'not-really-a-png',
    });
    assert.strictEqual(upload.status, 200);
    const { fileId } = await upload.json();

    const file = await db.collection('media_objects').findOne({ _id: fileId });
    const response = await fetch(`${getServerBaseUrl()}${file.url}`);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers.get('content-type'), 'image/png');
    assert.strictEqual(response.headers.get('content-disposition'), 'inline');
    assert.strictEqual(response.headers.get('x-content-type-options'), 'nosniff');
  });
});
