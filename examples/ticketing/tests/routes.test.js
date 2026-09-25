import test from 'node:test';
import assert from 'node:assert';

// Runs against the example started by `test:integration:start` (see package.json).
const baseUrl = process.env.ROOT_URL || 'http://localhost:4010';

test.before(async () => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      await fetch(`${baseUrl}/graphql`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: '{ shopInfo { _id } }' }),
      });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`The ticketing example did not start on ${baseUrl}`);
});

test.describe('Ticketing routes', () => {
  test('print tickets rejects requests without orderId and otp', async () => {
    const response = await fetch(`${baseUrl}/rest/print_tickets`);
    assert.strictEqual(response.status, 403);
  });

  test('google wallet download answers 404 for an unknown token', async () => {
    const response = await fetch(`${baseUrl}/rest/google-wallet/download/unknown-token?hash=x`);
    assert.strictEqual(response.status, 404);
    assert.deepStrictEqual(await response.json(), { error: 'Token not found' });
  });

  test('apple wallet download answers 404 for an unknown token', async () => {
    const response = await fetch(
      `${baseUrl}/rest/apple-wallet/download/unknown-token.pkpass?hash=x`,
    );
    assert.strictEqual(response.status, 404);
    assert.deepStrictEqual(await response.json(), { error: 'Token not found' });
  });
});
