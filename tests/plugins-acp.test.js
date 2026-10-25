import assert from 'node:assert';
import test from 'node:test';
import { OrderPricingSheet, PaymentDirector } from '@unchainedshop/core';
import { deliverySettings } from '@unchainedshop/core-delivery';
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

const unavailableOptionMessage = {
  type: 'error',
  code: 'invalid',
  param: '$.selected_fulfillment_options[0].option_id',
  content_type: 'plain',
  content: 'The selected fulfillment option is not available',
};

const sessionTotal = (session) => session.totals.find(({ type }) => type === 'total').amount;

const validSessionBody = () => ({
  line_items: [{ id: 'simpleproduct', quantity: 1 }],
  currency: 'CHF',
  capabilities: { payment: {} },
});

const readySessionBody = () => ({
  ...validSessionBody(),
  buyer: { email: 'buyer@example.com' },
  fulfillment_details: {
    address: {
      name: 'Ada Lovelace',
      line_one: 'Teststrasse 1',
      postal_code: '8000',
      city: 'Zürich',
      country: 'CH',
    },
  },
});

const createSession = async (body = validSessionBody()) => {
  const res = await acpFetch('/acp/checkout_sessions', {
    method: 'POST',
    body,
    idempotencyKey: idem(),
  });
  const session = await res.json();
  assert.strictEqual(res.status, 201, JSON.stringify(session));
  return session;
};

test.describe('Plugins: ACP checkout', () => {
  let db;

  test.before(async () => {
    [db] = await setupDatabase();
    baseUrl = getServerBaseUrl();
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

    const afterCancel = await acpFetch(`/acp/checkout_sessions/${id}/cancel`, {
      method: 'POST',
      idempotencyKey: idem(),
    });
    assert.strictEqual(afterCancel.status, 405);
  });

  test('uses billing as a shipping fallback without replacing an existing shipping address', async () => {
    const shippingAddress = {
      name: 'Shipping Recipient',
      line_one: 'Shippingstrasse 1',
      postal_code: '8000',
      city: 'Zürich',
      country: 'CH',
    };
    const billingAddress = {
      name: 'Billing Recipient',
      line_one: 'Billingstrasse 2',
      postal_code: '3000',
      city: 'Bern',
      country: 'CH',
    };
    const updatedBillingAddress = {
      ...billingAddress,
      line_one: 'Billingstrasse 3',
    };

    const created = await createSession();
    let response = await acpFetch(`/acp/checkout_sessions/${created.id}`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: {
        fulfillment_details: { address: shippingAddress },
        payment_data: { billing_address: billingAddress },
      },
    });
    assert.strictEqual(response.status, 200, JSON.stringify(await response.clone().json()));
    assert.strictEqual(
      (await response.json()).fulfillment_details.address.line_one,
      shippingAddress.line_one,
    );

    let order = await db.collection('orders').findOne({ _id: created.id });
    let delivery = await db.collection('order_deliveries').findOne({ _id: order.deliveryId });
    assert.strictEqual(order.billingAddress.addressLine, billingAddress.line_one);
    assert.strictEqual(delivery.context.address.addressLine, shippingAddress.line_one);

    response = await acpFetch(`/acp/checkout_sessions/${created.id}`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: { payment_data: { billing_address: updatedBillingAddress } },
    });
    assert.strictEqual(response.status, 200, JSON.stringify(await response.clone().json()));

    order = await db.collection('orders').findOne({ _id: created.id });
    delivery = await db.collection('order_deliveries').findOne({ _id: order.deliveryId });
    assert.strictEqual(order.billingAddress.addressLine, updatedBillingAddress.line_one);
    assert.strictEqual(delivery.context.address.addressLine, shippingAddress.line_one);

    const shippingOnlySession = await createSession();
    const shippingOnlyOrder = await db.collection('orders').findOne({ _id: shippingOnlySession.id });
    await db
      .collection('order_deliveries')
      .updateOne({ _id: shippingOnlyOrder.deliveryId }, { $set: { 'context.address': {} } });
    response = await acpFetch(`/acp/checkout_sessions/${shippingOnlySession.id}`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: { fulfillment_details: { address: shippingAddress } },
    });
    assert.strictEqual(response.status, 200, JSON.stringify(await response.clone().json()));

    order = await db.collection('orders').findOne({ _id: shippingOnlySession.id });
    delivery = await db.collection('order_deliveries').findOne({ _id: order.deliveryId });
    assert.strictEqual(order.billingAddress.addressLine, shippingAddress.line_one);
    assert.strictEqual(delivery.context.address, null);

    response = await acpFetch(`/acp/checkout_sessions/${shippingOnlySession.id}`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: { payment_data: { billing_address: billingAddress } },
    });
    assert.strictEqual(response.status, 200, JSON.stringify(await response.clone().json()));
    assert.strictEqual(
      (await response.json()).fulfillment_details.address.line_one,
      shippingAddress.line_one,
    );

    order = await db.collection('orders').findOne({ _id: shippingOnlySession.id });
    delivery = await db.collection('order_deliveries').findOne({ _id: order.deliveryId });
    assert.strictEqual(order.billingAddress.addressLine, billingAddress.line_one);
    assert.strictEqual(delivery.context.address.addressLine, shippingAddress.line_one);
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

  test('replays a session however the bearer scheme is spelled', async () => {
    const idempotencyKey = idem();
    const first = await acpFetch('/acp/checkout_sessions', {
      method: 'POST',
      body: validSessionBody(),
      idempotencyKey,
    });
    const replay = await acpFetch('/acp/checkout_sessions', {
      method: 'POST',
      body: validSessionBody(),
      idempotencyKey,
      token: null,
      headers: { authorization: `bearer ${API_KEY}` },
    });
    assert.strictEqual(replay.headers.get('idempotent-replayed'), 'true');
    assert.strictEqual((await replay.json()).id, (await first.json()).id);
  });

  test('replays an error response and echoes its Idempotency-Key', async () => {
    const idempotencyKey = idem();
    const body = { ...validSessionBody(), line_items: [{ id: 'missing-product', quantity: 1 }] };
    const first = await acpFetch('/acp/checkout_sessions', { method: 'POST', body, idempotencyKey });
    const replay = await acpFetch('/acp/checkout_sessions', { method: 'POST', body, idempotencyKey });
    assert.deepStrictEqual(
      [first.status, first.headers.get('idempotency-key'), (await first.json()).code],
      [400, idempotencyKey, 'product_not_found'],
    );
    assert.deepStrictEqual([replay.status, replay.headers.get('idempotent-replayed')], [400, 'true']);
  });

  test('keeps buyer and recipient contact apart', async () => {
    const created = await createSession();
    const res = await acpFetch(`/acp/checkout_sessions/${created.id}`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: {
        buyer: { email: 'buyer@example.com', phone_number: '+41791111111' },
        fulfillment_details: { email: 'recipient@example.com', phone_number: '+41792222222' },
      },
    });
    const session = await res.json();
    assert.deepStrictEqual(session.buyer, {
      email: 'buyer@example.com',
      phone_number: '+41791111111',
    });
    assert.partialDeepStrictEqual(session.fulfillment_details, {
      email: 'recipient@example.com',
      phone_number: '+41792222222',
    });

    const order = await db.collection('orders').findOne({ _id: created.id });
    const delivery = await db.collection('order_deliveries').findOne({ _id: order.deliveryId });
    assert.deepStrictEqual(order.contact, {
      emailAddress: 'buyer@example.com',
      telNumber: '+41791111111',
    });
    assert.deepStrictEqual(delivery.context.contact, {
      emailAddress: 'recipient@example.com',
      telNumber: '+41792222222',
    });
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

  test('rejects an invalid update without applying any part of it', async () => {
    const created = await createSession();

    const invalidBuyer = await acpFetch(`/acp/checkout_sessions/${created.id}`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: { line_items: [{ id: 'simpleproduct', quantity: 3 }], buyer: { first_name: 'Ada' } },
    });
    assert.strictEqual(invalidBuyer.status, 400);
    assert.strictEqual((await invalidBuyer.json()).code, 'invalid_buyer');

    const unchanged = await (await acpFetch(`/acp/checkout_sessions/${created.id}`)).json();
    assert.deepStrictEqual(
      unchanged.line_items.map(({ id, quantity }) => ({ id, quantity })),
      [{ id: created.line_items[0].id, quantity: 1 }],
    );
  });

  test('applies an update and reports an unavailable fulfillment option as a message', async () => {
    const created = await createSession();
    const res = await acpFetch(`/acp/checkout_sessions/${created.id}`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: {
        line_items: [{ id: 'simpleproduct', quantity: 3 }],
        selected_fulfillment_options: [{ type: 'shipping', option_id: 'not-an-option', item_ids: [] }],
      },
    });
    const updated = await res.json();
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(updated.messages, [unavailableOptionMessage]);

    const persisted = await (await acpFetch(`/acp/checkout_sessions/${created.id}`)).json();
    assert.strictEqual(persisted.line_items[0].quantity, 3);
    assert.strictEqual(sessionTotal(persisted), 3 * sessionTotal(created));
  });

  test('selects a fulfillment option that only the updated address supports', async (t) => {
    t.mock.method(deliverySettings, 'filterSupportedProviders', async ({ providers, order }) =>
      providers.filter(
        ({ _id }) =>
          _id ===
          (order.billingAddress?.countryCode === 'DE'
            ? 'send-mail-delivery-provider'
            : 'simple-delivery-provider'),
      ),
    );
    const created = await createSession();
    const res = await acpFetch(`/acp/checkout_sessions/${created.id}`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: {
        fulfillment_details: {
          address: {
            name: 'Ada Lovelace',
            line_one: 'Unter den Linden 1',
            postal_code: '10117',
            city: 'Berlin',
            country: 'DE',
          },
        },
        selected_fulfillment_options: [
          { type: 'shipping', option_id: 'send-mail-delivery-provider', item_ids: [] },
        ],
      },
    });
    const updated = await res.json();
    assert.strictEqual(res.status, 200, JSON.stringify(updated));
    assert.deepStrictEqual(updated.messages, []);
    assert.strictEqual(updated.selected_fulfillment_options[0].option_id, 'send-mail-delivery-provider');
  });

  test('does not charge a complete with an unavailable fulfillment option', async () => {
    const created = await createSession();
    const res = await acpFetch(`/acp/checkout_sessions/${created.id}/complete`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: {
        buyer: { email: 'buyer@example.com' },
        fulfillment_details: {
          address: {
            name: 'Ada Lovelace',
            line_one: 'Teststrasse 1',
            postal_code: '8000',
            city: 'Zürich',
            country: 'CH',
          },
        },
        selected_fulfillment_options: [{ type: 'shipping', option_id: 'not-an-option', item_ids: [] }],
        payment_data: {
          handler_id: 'stripe_spt',
          instrument: { type: 'card', credential: { type: 'spt', token: 'spt_test' } },
        },
      },
    });
    const session = await res.json();
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(session.messages, [unavailableOptionMessage]);
    assert.strictEqual(session.order, undefined);
    assert.strictEqual((await db.collection('orders').findOne({ _id: created.id })).status, null);
  });

  test('rejects an invalid complete without applying its session updates', async () => {
    const created = await createSession();
    const sessionUpdate = {
      fulfillment_details: {
        address: {
          name: 'Ada Lovelace',
          line_one: 'Teststrasse 1',
          postal_code: '8000',
          city: 'Zürich',
          country: 'CH',
        },
      },
      line_items: [{ id: 'simpleproduct', quantity: 4 }],
    };

    const missingToken = await acpFetch(`/acp/checkout_sessions/${created.id}/complete`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: { ...sessionUpdate, buyer: { email: 'not-persisted@example.com' }, payment_data: {} },
    });
    assert.strictEqual(missingToken.status, 400);
    assert.strictEqual((await missingToken.json()).code, 'invalid_payment_data');

    const missingBuyer = await acpFetch(`/acp/checkout_sessions/${created.id}/complete`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: {
        ...sessionUpdate,
        payment_data: {
          handler_id: 'stripe_spt',
          instrument: { type: 'card', credential: { type: 'spt', token: 'spt_test' } },
        },
      },
    });
    assert.strictEqual(missingBuyer.status, 400);
    assert.strictEqual((await missingBuyer.json()).code, 'invalid_buyer');

    const unchanged = await (await acpFetch(`/acp/checkout_sessions/${created.id}`)).json();
    assert.strictEqual(unchanged.status, 'not_ready_for_payment');
    assert.strictEqual(unchanged.buyer, undefined);
    assert.strictEqual(unchanged.fulfillment_details?.address, undefined);
    assert.strictEqual(unchanged.line_items[0].quantity, 1);
  });

  test('rejects non-integer quantities and reports arbitrary fulfillment option IDs', async () => {
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
    assert.strictEqual(invalidFulfillment.status, 200);
    assert.deepStrictEqual((await invalidFulfillment.json()).messages, [unavailableOptionMessage]);
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
      body: { ...validSessionBody(), line_items: [{ id: 'missing-product', quantity: 1 }] },
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual((await res.json()).code, 'product_not_found');
    assert.deepStrictEqual(
      await Promise.all([
        db.collection('users').countDocuments({ guest: true }),
        db.collection('orders').countDocuments({ status: null }),
        db.collection('order_positions').countDocuments(),
      ]),
      [guestsBefore, cartsBefore, positionsBefore],
    );
  });

  test('processes one request per session while the payment is charged', async (t) => {
    const created = await createSession(readySessionBody());

    const { promise: charging, resolve: chargingStarted } = Promise.withResolvers();
    const { promise: paid, resolve: pay } = Promise.withResolvers();
    let chargedAmount;
    t.mock.method(PaymentDirector, 'chargeOrderPayment', async (order, _context, { modules }) => {
      chargedAmount = OrderPricingSheet({
        calculation: order.calculation,
        currencyCode: order.currencyCode,
      }).total().amount;
      chargingStarted();
      await paid;
      return modules.orders.payments.updateStatus(order.paymentId, {
        status: 'PAID',
        transactionId: 'charged-while-locked',
        info: '{}',
      });
    });

    const completing = acpFetch(`/acp/checkout_sessions/${created.id}/complete`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: {
        payment_data: {
          handler_id: 'stripe_spt',
          instrument: { type: 'card', credential: { type: 'spt', token: 'spt_test' } },
        },
      },
    });
    await charging;
    const [update, cancel] = await Promise.all([
      acpFetch(`/acp/checkout_sessions/${created.id}`, {
        method: 'POST',
        idempotencyKey: idem(),
        body: { line_items: [{ id: 'simpleproduct', quantity: 10 }] },
      }),
      acpFetch(`/acp/checkout_sessions/${created.id}/cancel`, {
        method: 'POST',
        idempotencyKey: idem(),
        body: {},
      }),
    ]);
    pay();
    const completed = await (await completing).json();

    assert.deepStrictEqual(
      [update.status, (await update.json()).code, update.headers.get('retry-after'), cancel.status],
      [409, 'session_in_progress', '1', 409],
    );
    assert.strictEqual(completed.status, 'completed');
    assert.strictEqual(completed.line_items[0].quantity, 1);
    assert.strictEqual(completed.totals.find(({ type }) => type === 'total').amount, chargedAmount);

    const lateCancel = await acpFetch(`/acp/checkout_sessions/${created.id}/cancel`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: {},
    });
    assert.strictEqual(lateCancel.status, 405);
  });

  test('reports a payment that needs an authentication of the buyer', async (t) => {
    const created = await createSession(readySessionBody());
    t.mock.method(PaymentDirector, 'chargeOrderPayment', async () => {
      throw new Error('The payment requires an authentication of the buyer', {
        cause: 'PAYMENT_REQUIRES_ACTION',
      });
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
    const session = await res.json();

    assert.strictEqual(res.status, 200);
    assert.partialDeepStrictEqual(session.messages, [{ type: 'error', code: 'requires_3ds' }]);
    assert.strictEqual((await db.collection('orders').findOne({ _id: created.id })).status, null);
  });

  test('GET /acp/feed.jsonl streams a product feed as ndjson', async () => {
    const res = await acpFetch('/acp/feed.jsonl', { method: 'GET' });
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get('content-type') || '', /ndjson/);
    const rows = (await res.text())
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    for (const row of rows) {
      assert.ok(row.id);
      assert.ok(Array.isArray(row.variants));
      for (const variant of row.variants) {
        assert.ok(variant.id);
        assert.ok(variant.title);
      }
      assert.ok(!('item_id' in row));
    }
    const exportedIds = rows.map(({ id }) => id);
    const proxyVariantIds = ['proxy-plan-product-1', 'proxy-simple-product-1', 'proxy-simple-product-2'];
    assert.ok(exportedIds.includes('simpleproduct'));
    assert.ok(!exportedIds.includes('simpleproduct_draft'));
    assert.ok(!proxyVariantIds.some((variantId) => exportedIds.includes(variantId)));
    assert.deepStrictEqual(
      rows
        .find(({ id }) => id === 'proxy-product')
        .variants.map(({ id }) => id)
        .sort(),
      proxyVariantIds,
    );
  });
});
