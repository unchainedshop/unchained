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
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
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
  let db;

  test.before(async () => {
    [db] = await setupDatabase();
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
    assert.deepStrictEqual(body.protocol, {
      name: 'acp',
      version: API_VERSION,
      supported_versions: [API_VERSION],
    });
    assert.strictEqual(body.api_base_url, `${baseUrl}/acp`);
    assert.deepStrictEqual(body.transports, ['rest']);
    assert.deepStrictEqual(body.capabilities.services, ['checkout']);
    assert.strictEqual(res.headers.get('cache-control'), 'public, max-age=3600');
  });

  test('publishes payment handler and instrument schemas without auth', async () => {
    const [configResponse, instrumentResponse] = await Promise.all([
      fetch(`${baseUrl}/.well-known/acp/schemas/payment-handler-config.json`),
      fetch(`${baseUrl}/.well-known/acp/schemas/payment-instrument.json`),
    ]);
    assert.strictEqual(configResponse.status, 200);
    assert.strictEqual(instrumentResponse.status, 200);
    const configSchema = await configResponse.json();
    const instrumentSchema = await instrumentResponse.json();
    assert.deepStrictEqual(configSchema.required, ['merchant_id', 'psp']);
    assert.deepStrictEqual(instrumentSchema.required, ['type', 'credential']);
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
    const body = await res.json();
    assert.strictEqual(body.code, 'missing_api_version');
    assert.deepStrictEqual(body.supported_versions, [API_VERSION]);
  });

  test('rejects a POST without an Idempotency-Key with 400', async () => {
    const res = await acpFetch('/acp/checkout_sessions', {
      method: 'POST',
      body: validSessionBody(),
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual((await res.json()).code, 'idempotency_key_required');
  });

  test('rejects an Idempotency-Key longer than 255 characters', async () => {
    const res = await acpFetch('/acp/checkout_sessions', {
      method: 'POST',
      body: validSessionBody(),
      idempotencyKey: 'x'.repeat(256),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.type, 'invalid_request');
    assert.strictEqual(body.code, 'invalid_idempotency_key');
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
    assert.strictEqual(body.capabilities.payment.handlers[0].config.merchant_id, 'test-merchant');
    assert.strictEqual(body.capabilities.payment.handlers[0].config.psp, 'stripe');
    assert.strictEqual(
      body.capabilities.payment.handlers[0].config_schema,
      `${baseUrl}/.well-known/acp/schemas/payment-handler-config.json`,
    );
    assert.strictEqual(body.continue_url, 'https://shop.test.example/orders');
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
    const canceledBody = await canceled.json();
    assert.strictEqual(canceled.status, 200, JSON.stringify(canceledBody));
    assert.strictEqual(canceledBody.status, 'canceled');

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

  test('complete uses buyer information persisted by an earlier update', async () => {
    const created = await createSession();
    const updated = await acpFetch(`/acp/checkout_sessions/${created.id}`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: {
        buyer: { email: 'stored-buyer@example.com' },
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
    const updatedBody = await updated.json();
    const option = updatedBody.fulfillment_options[0];
    assert.ok(option);
    await acpFetch(`/acp/checkout_sessions/${created.id}`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: {
        selected_fulfillment_options: [
          {
            type: option.type,
            option_id: option.id,
            item_ids: updatedBody.line_items.map(({ id }) => id),
          },
        ],
      },
    });
    const res = await acpFetch(`/acp/checkout_sessions/${created.id}/complete`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: {
        payment_data: {
          handler_id: 'stripe_spt',
          instrument: { type: 'card', credential: { type: 'spt', token: 'spt_test' } },
        },
      },
    });
    assert.strictEqual(res.status, 200, JSON.stringify(await res.clone().json()));
    const body = await res.json();
    assert.strictEqual(body.buyer.email, 'stored-buyer@example.com');
    assert.ok(body.order.permalink_url.startsWith('https://shop.test.example/orders/'));
    assert.notStrictEqual(body.order.status, 'fulfilled');
  });

  test('does not expose non-ACP orders through the globally authenticated endpoint', async () => {
    const created = await createSession();
    const source = await db.collection('orders').findOne({ _id: created.id });
    const nonACPOrderId = `non-acp-${Date.now()}`;
    await db.collection('orders').insertOne({
      ...source,
      _id: nonACPOrderId,
      context: {},
      paymentId: undefined,
      deliveryId: undefined,
    });
    const res = await acpFetch(`/acp/checkout_sessions/${nonACPOrderId}`);
    assert.strictEqual(res.status, 404);
  });

  test('validates every replacement item before changing the cart', async () => {
    const created = await createSession();
    const res = await acpFetch(`/acp/checkout_sessions/${created.id}`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: {
        line_items: [
          { id: 'simpleproduct', quantity: 2 },
          { id: 'missing-product', quantity: 1 },
        ],
      },
    });
    assert.strictEqual(res.status, 400);

    const unchanged = await (await acpFetch(`/acp/checkout_sessions/${created.id}`)).json();
    assert.strictEqual(unchanged.line_items.length, 1);
    assert.strictEqual(unchanged.line_items[0].quantity, 1);
  });

  test('rejects non-integer quantities and arbitrary fulfillment option IDs', async () => {
    const created = await createSession();
    const invalidQuantity = await acpFetch(`/acp/checkout_sessions/${created.id}`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: { line_items: [{ id: 'simpleproduct', quantity: '2' }] },
    });
    assert.strictEqual(invalidQuantity.status, 400);
    assert.strictEqual((await invalidQuantity.json()).code, 'invalid_quantity');

    const invalidFulfillment = await acpFetch(`/acp/checkout_sessions/${created.id}`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: {
        selected_fulfillment_options: [{ type: 'shipping', option_id: 'arbitrary-id', item_ids: [] }],
      },
    });
    assert.strictEqual(invalidFulfillment.status, 400);
    assert.strictEqual((await invalidFulfillment.json()).code, 'invalid_fulfillment_option');
  });

  test('rejects malformed JSON without creating a guest', async () => {
    const guestsBefore = await db.collection('users').countDocuments({ guest: true });
    const res = await fetch(`${baseUrl}/acp/checkout_sessions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${API_KEY}`,
        'api-version': API_VERSION,
        'idempotency-key': idem(),
      },
      body: '{',
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual((await res.json()).code, 'invalid_json');
    assert.strictEqual(await db.collection('users').countDocuments({ guest: true }), guestsBefore);
  });

  test('removes the provisioned guest and cart when session creation fails', async () => {
    const [guestsBefore, cartsBefore, positionsBefore] = await Promise.all([
      db.collection('users').countDocuments({ guest: true }),
      db.collection('orders').countDocuments({ status: null }),
      db.collection('order_positions').countDocuments(),
    ]);

    const res = await acpFetch('/acp/checkout_sessions', {
      method: 'POST',
      idempotencyKey: idem(),
      body: {
        ...validSessionBody(),
        selected_fulfillment_options: [{ type: 'shipping', option_id: 'not-an-option', item_ids: [] }],
      },
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual((await res.json()).code, 'invalid_fulfillment_option');
    assert.deepStrictEqual(
      await Promise.all([
        db.collection('users').countDocuments({ guest: true }),
        db.collection('orders').countDocuments({ status: null }),
        db.collection('order_positions').countDocuments(),
      ]),
      [guestsBefore, cartsBefore, positionsBefore],
    );
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
        assert.ok(row.id);
        assert.ok(Array.isArray(row.variants));
        for (const variant of row.variants) {
          assert.ok(variant.id);
          assert.ok(variant.title);
        }
        assert.ok(!('item_id' in row));
      }
    }
  });
});
