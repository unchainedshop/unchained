import test from 'node:test';
import assert from 'node:assert';
import { setupDatabase, disconnect, getServerBaseUrl } from './helpers.js';
import { TokenizedProduct1 } from './seeds/products.js';
import { TestToken1 } from './seeds/tokens.js';

test.describe('Plugin: ERC metadata routes', () => {
  test.before(async () => {
    await setupDatabase();
  });

  test.after(async () => {
    await disconnect();
  });

  for (const path of [
    `/erc-metadata/${TokenizedProduct1._id}/${TestToken1.tokenSerialNumber}.json`,
    `/erc-metadata/${TokenizedProduct1._id}/en/${TestToken1.tokenSerialNumber}.json`,
  ]) {
    test(`GET ${path} reaches the metadata handler`, async () => {
      const response = await fetch(`${getServerBaseUrl()}${path}`);
      const body = await response.text();
      assert.doesNotMatch(body, /Route GET:.* not found/);
    });
  }
});
