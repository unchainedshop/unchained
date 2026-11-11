import test from 'node:test';
import assert from 'node:assert';
import { setupDatabase, disconnect, getServerBaseUrl } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';

test.describe('Cross-site requests', () => {
  test.before(async () => {
    await setupDatabase();
  });

  test.after(async () => {
    await disconnect();
  });

  test('graphql refuses content types a cross-site form can send', async () => {
    for (const contentType of [
      'text/plain',
      'application/x-www-form-urlencoded',
      'multipart/form-data; boundary=x',
    ]) {
      const response = await fetch(`${getServerBaseUrl()}/graphql`, {
        method: 'POST',
        headers: { 'content-type': contentType, authorization: ADMIN_TOKEN },
        body: JSON.stringify({ query: '{ me { _id } }' }),
      });
      assert.strictEqual(response.status, 415, contentType);
    }
  });

  test('bulk import and temp upload refuse browser requests from another site', async () => {
    for (const path of ['/bulk-import', '/temp-upload']) {
      const response = await fetch(`${getServerBaseUrl()}${path}`, {
        method: 'POST',
        headers: {
          'content-type': 'text/plain',
          authorization: ADMIN_TOKEN,
          'sec-fetch-site': 'cross-site',
        },
        body: '{}',
      });
      assert.strictEqual(response.status, 403, path);
    }
  });
});
