import test from 'node:test';
import assert from 'node:assert';
import { disconnect, getServerPort, setupDatabase } from './helpers.js';
import { TestToken1 } from './seeds/tokens.js';

const VALID_TOKEN1_HASH = '14e21852abe0b7609b6659ffed526ab9d261c8a43c72481043a6141f782e3df0';

test.describe('googleWallet', () => {
  test.before(async () => {
    await setupDatabase();
  });

  test.after(async () => {
    await disconnect();
  });
  test('Return PASS_GENERATION_ERROR after success because no default renderer is registered', async () => {
    const result = await fetch(
      `http://localhost:${getServerPort()}/rest/google-wallet/download/${TestToken1._id}?hash=${VALID_TOKEN1_HASH}`,
    );
    assert.strictEqual(result.status, 500);
    const errorsMessage = await result.json();
    assert.strictEqual(errorsMessage.success, false);

    assert.strictEqual(errorsMessage.message, 'Error generating pass');
    assert.strictEqual(errorsMessage.name, 'PASS_GENERATION_ERROR');
  });

  test('Return HASH_MISMATCH Error when invalid hash is provided', async () => {
    const result = await fetch(
      `http://localhost:${getServerPort()}/rest/google-wallet/download/test-token-1?hash=14e21852abe0b7609b6659ffed526ab9d261c8a43c72481043a6141f782e3`,
    );
    assert.strictEqual(result.status, 403);
    const errorsMessage = await result.json();
    assert.strictEqual(errorsMessage.success, false);
    assert.strictEqual(errorsMessage.message, 'Token hash invalid for current owner');
    assert.strictEqual(errorsMessage.name, 'HASH_MISMATCH');
  });
  test('Return Not found / 4040 when non existing token ID is provided', async () => {
    const result = await fetch(
      `http://localhost:${getServerPort()}/rest/google-wallet/download/invalid-id?hash=${VALID_TOKEN1_HASH}`,
    );
    assert.strictEqual(result.status, 404);
  });
});
