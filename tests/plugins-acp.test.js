import assert from 'node:assert';
import test from 'node:test';
import { setupDatabase, disconnect, getServerBaseUrl } from './helpers.js';

const API_KEY = 'test-acp-secret-key';
const API_VERSION = '2026-04-17';

let baseUrl;
let uid = 0;
const idem = () => `idem-${Date.now()}-${uid++}`;

const acpFetch = (
  path,
  { method = 'GET', body, token = API_KEY, apiVersion = API_VERSION, idempotencyKey, headers = {} } = {},
) =>
  fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-shop-country': 'CH',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(apiVersion ? { 'api-version': apiVersion } : {}),
      ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

const validSessionBody = () => ({
  line_items: [{ id: 'simpleproduct', quantity: 1 }],
  currency: 'CHF',
  capabilities: { payment: {} },
});

const createSession = async () => {
  const res = await acpFetch('/acp/checkout_sessions', {
    method: 'POST',
    body: validSessionBody(),
    idempotencyKey: idem(),
  });
  const body = await res.json();
  assert.strictEqual(res.status, 201, JSON.stringify(body));
  return body;
};

test.describe('Plugins: ACP checkout', () => {
  test.before(async () => {
    const [db] = await setupDatabase();
    baseUrl = getServerBaseUrl();
    // The ACP provider is configured via UNCHAINED_ACP_PAYMENT_PROVIDER_ID (.env.tests).
    // The SPT charge needs real Stripe creds, so — since the session lifecycle is
    // adapter-agnostic — we point it at the already-registered cryptopay GENERIC adapter
    // (STRIPE_SECRET is intentionally empty in the hermetic test env). This also exercises
    // the PSP-agnostic path: ACP driving a non-Stripe adapter.
    await db.collection('payment-providers').insertOne({
      _id: 'acp-test-provider',
      adapterKey: 'shop.unchained.payment.cryptopay',
      created: new Date(),
      configuration: [],
      type: 'GENERIC',
    });
  });

  test.after(async () => {
    await disconnect();
  });

  test('GET /.well-known/acp.json advertises the protocol (no auth)', async () => {
    const res = await fetch(`${baseUrl}/.well-known/acp.json`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.protocol, 'agentic-commerce-protocol');
    assert.deepStrictEqual(body.api_versions, [API_VERSION]);
    assert.ok(body.capabilities.includes('stripe_spt'));
  });

  test('rejects a missing bearer token with 401', async () => {
    const res = await acpFetch('/acp/checkout_sessions', {
      method: 'POST',
      body: validSessionBody(),
      token: null,
      idempotencyKey: idem(),
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual((await res.json()).code, 'invalid_api_key');
  });

  test('rejects a missing API-Version with 400', async () => {
    const res = await acpFetch('/acp/checkout_sessions', {
      method: 'POST',
      body: validSessionBody(),
      apiVersion: null,
      idempotencyKey: idem(),
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual((await res.json()).code, 'missing_api_version');
  });

  test('rejects a POST without an Idempotency-Key with 400', async () => {
    const res = await acpFetch('/acp/checkout_sessions', {
      method: 'POST',
      body: validSessionBody(),
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual((await res.json()).code, 'idempotency_key_required');
  });

  test('creates a checkout session (201) from line_items', async () => {
    const body = await createSession();
    assert.ok(body.id);
    assert.strictEqual(body.currency, 'chf');
    assert.strictEqual(body.line_items.length, 1);
    assert.strictEqual(body.line_items[0].product_id, 'simpleproduct');
    assert.ok(body.totals.find((total) => total.type === 'total'));
    // PSP-agnostic handler advertised (Payment Handlers Framework)
    assert.strictEqual(body.capabilities.payment.handlers[0].id, 'stripe_spt');
    assert.strictEqual(body.capabilities.payment.handlers[0].psp, 'stripe');
  });

  test('supports get / update / cancel and marks the session terminal', async () => {
    const created = await createSession();
    const { id } = created;

    const got = await acpFetch(`/acp/checkout_sessions/${id}`);
    assert.strictEqual(got.status, 200);
    assert.strictEqual((await got.json()).id, id);

    const updated = await acpFetch(`/acp/checkout_sessions/${id}`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: {
        buyer: { email: 'agent-buyer@example.com', phone_number: '+41791234567' },
        fulfillment_details: {
          address: {
            name: 'Ada Lovelace',
            line_one: 'Teststrasse 1',
            postal_code: '8000',
            city: 'Zürich',
            country: 'CH',
          },
        },
      },
    });
    assert.strictEqual(updated.status, 200);
    assert.strictEqual((await updated.json()).buyer.email, 'agent-buyer@example.com');

    const canceled = await acpFetch(`/acp/checkout_sessions/${id}/cancel`, {
      method: 'POST',
      idempotencyKey: idem(),
    });
    assert.strictEqual(canceled.status, 200);
    assert.strictEqual((await canceled.json()).status, 'canceled');

    // terminal → further mutations rejected
    const afterCancel = await acpFetch(`/acp/checkout_sessions/${id}/cancel`, {
      method: 'POST',
      idempotencyKey: idem(),
    });
    assert.strictEqual(afterCancel.status, 405);
  });

  test('replays the response for a repeated Idempotency-Key + body', async () => {
    const key = idem();
    const first = await acpFetch('/acp/checkout_sessions', {
      method: 'POST',
      body: validSessionBody(),
      idempotencyKey: key,
    });
    const firstBody = await first.json();
    const second = await acpFetch('/acp/checkout_sessions', {
      method: 'POST',
      body: validSessionBody(),
      idempotencyKey: key,
    });
    assert.strictEqual(second.headers.get('idempotent-replayed'), 'true');
    assert.strictEqual((await second.json()).id, firstBody.id);
  });

  test('rejects a reused Idempotency-Key with a different body (422)', async () => {
    const key = idem();
    await acpFetch('/acp/checkout_sessions', {
      method: 'POST',
      body: validSessionBody(),
      idempotencyKey: key,
    });
    const conflict = await acpFetch('/acp/checkout_sessions', {
      method: 'POST',
      idempotencyKey: key,
      body: { ...validSessionBody(), line_items: [{ id: 'simpleproduct', quantity: 5 }] },
    });
    assert.strictEqual(conflict.status, 422);
    assert.strictEqual((await conflict.json()).code, 'idempotency_conflict');
  });

  test('complete without buyer.email returns 400 (no charge attempted)', async () => {
    const created = await createSession();
    const res = await acpFetch(`/acp/checkout_sessions/${created.id}/complete`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: { payment_data: { token: 'spt_test', handler_id: 'stripe_spt' } },
    });
    assert.strictEqual(res.status, 400);
  });

  test('GET /acp/feed.jsonl streams a product feed as ndjson', async () => {
    const res = await acpFetch('/acp/feed.jsonl', { method: 'GET' });
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /ndjson/);
    const text = await res.text();
    // Rows require a resolvable image; assert any emitted line is a valid feed row.
    if (text.trim()) {
      for (const line of text.trim().split('\n')) {
        const row = JSON.parse(line);
        assert.ok(row.item_id);
        assert.ok('is_eligible_search' in row);
      }
    }
  });
});
