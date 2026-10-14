import assert from 'node:assert';
import test from 'node:test';
import { setupDatabase, disconnect, getServerBaseUrl } from './helpers.js';

const { STRIPE_SECRET } = process.env;
const API_KEY = 'test-acp-secret-key';
const API_VERSION = '2026-04-17';
const SPT_STRIPE_VERSION = '2026-04-22.preview';

let baseUrl;
let uid = 0;
const idem = () => `idem-charge-${Date.now()}-${uid++}`;

const acpFetch = (path, { method = 'GET', body, idempotencyKey } = {}) =>
  fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-shop-country': 'CH',
      authorization: `Bearer ${API_KEY}`,
      'api-version': API_VERSION,
      ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

const stripeForm = (data) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) params.append(key, String(value));
  return params;
};

const mintSPT = async ({
  currency = 'chf',
  maxAmount = 1000000,
  paymentMethod = 'pm_card_visa',
} = {}) => {
  const res = await fetch('https://api.stripe.com/v1/test_helpers/shared_payment/granted_tokens', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${STRIPE_SECRET}`,
      'stripe-version': SPT_STRIPE_VERSION,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: stripeForm({
      payment_method: paymentMethod,
      'usage_limits[currency]': currency,
      'usage_limits[max_amount]': maxAmount,
      'usage_limits[expires_at]': Math.floor(Date.now() / 1000) + 3600,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`SPT mint failed (${res.status}): ${JSON.stringify(json)}`);
  return json.id;
};

const retrievePaymentIntent = async (id) => {
  const res = await fetch(`https://api.stripe.com/v1/payment_intents/${id}`, {
    headers: { authorization: `Bearer ${STRIPE_SECRET}` },
  });
  return res.json();
};

const revokeSPT = async (id) => {
  try {
    await fetch(`https://api.stripe.com/v1/test_helpers/shared_payment/granted_tokens/${id}/revoke`, {
      method: 'POST',
      headers: { authorization: `Bearer ${STRIPE_SECRET}`, 'stripe-version': SPT_STRIPE_VERSION },
    });
  } catch {
    /**/
  }
};

const readySession = async () => {
  const created = await acpFetch('/acp/checkout_sessions', {
    method: 'POST',
    idempotencyKey: idem(),
    body: {
      line_items: [{ id: 'simpleproduct', quantity: 1 }],
      currency: 'CHF',
      capabilities: { payment: {} },
    },
  });
  assert.strictEqual(created.status, 201);
  const { id } = await created.json();

  await acpFetch(`/acp/checkout_sessions/${id}`, {
    method: 'POST',
    idempotencyKey: idem(),
    body: {
      buyer: { email: 'agent-buyer@example.com' },
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

  const withOptions = await (await acpFetch(`/acp/checkout_sessions/${id}`)).json();
  assert.ok(withOptions.fulfillment_options.length > 0, 'expected a supported delivery provider');
  const [option] = withOptions.fulfillment_options;
  await acpFetch(`/acp/checkout_sessions/${id}`, {
    method: 'POST',
    idempotencyKey: idem(),
    body: {
      selected_fulfillment_options: [
        {
          type: option.type,
          option_id: option.id,
          item_ids: withOptions.line_items.map((item) => item.id),
        },
      ],
    },
  });
  return id;
};

const completeSession = async (orderId, token) => {
  const res = await acpFetch(`/acp/checkout_sessions/${orderId}/complete`, {
    method: 'POST',
    idempotencyKey: idem(),
    body: {
      buyer: { email: 'agent-buyer@example.com' },
      payment_data: {
        handler_id: 'stripe_spt',
        instrument: { type: 'card', credential: { type: 'spt', token } },
      },
    },
  });
  return { status: res.status, body: await res.json() };
};

test.describe('Plugins: ACP Shared Payment Token charge (real Stripe)', () => {
  if (!STRIPE_SECRET) return;

  let db;

  test.before(async () => {
    [db] = await setupDatabase();
    baseUrl = getServerBaseUrl();
    await db.collection('payment-providers').replaceOne(
      { _id: 'acp-test-provider' },
      {
        _id: 'acp-test-provider',
        adapterKey: 'shop.unchained.payment.stripe',
        created: new Date(),
        configuration: [{ key: 'descriptorPrefix', value: 'ACP Test' }],
        type: 'GENERIC',
      },
      { upsert: true },
    );
  });

  test.after(async () => {
    await disconnect();
  });

  test('mints an SPT, completes checkout, and persists the evidence trail', async () => {
    const orderId = await readySession();
    const sptId = await mintSPT({ currency: 'chf' });
    try {
      const completed = await completeSession(orderId, sptId);
      assert.strictEqual(completed.status, 200, JSON.stringify(completed.body));
      assert.strictEqual(completed.body.status, 'completed');
      assert.ok(['confirmed', 'completed'].includes(completed.body.order.status));

      const orderDoc = await db.collection('orders').findOne({ _id: orderId });
      const orderPayment = await db.collection('order_payments').findOne({ _id: orderDoc.paymentId });
      assert.ok(orderPayment, `no active order payment for order ${orderId}`);
      assert.strictEqual(orderPayment.status, 'PAID', `orderPayment=${JSON.stringify(orderPayment)}`);
      assert.match(orderPayment.transactionId, /^pi_/);
      const serialized = JSON.stringify(orderPayment);
      assert.ok(!serialized.includes(sptId), 'shared payment credentials must not be persisted');
      assert.ok(serialized.includes(SPT_STRIPE_VERSION), 'expected the SPT api version in the evidence');

      const paymentIntent = await retrievePaymentIntent(orderPayment.transactionId);
      assert.strictEqual(paymentIntent.statement_descriptor_suffix, `ORD ${orderDoc.orderNumber}`);
      assert.match(paymentIntent.description, new RegExp(` #${orderDoc.orderNumber}$`));
    } finally {
      await revokeSPT(sptId);
    }
  });

  test('reports a declined SPT and charges a fresh SPT for the same session', async () => {
    const orderId = await readySession();
    const declinedSptId = await mintSPT({ paymentMethod: 'pm_card_chargeDeclined' });
    const sptId = await mintSPT();
    try {
      const declined = await completeSession(orderId, declinedSptId);
      assert.strictEqual(declined.status, 200, JSON.stringify(declined.body));
      assert.strictEqual(declined.body.status, 'ready_for_payment');
      assert.deepStrictEqual(
        declined.body.messages.map(({ type, code }) => ({ type, code })),
        [{ type: 'error', code: 'payment_declined' }],
      );

      const completed = await completeSession(orderId, sptId);
      assert.strictEqual(completed.status, 200, JSON.stringify(completed.body));
      assert.strictEqual(completed.body.status, 'completed');
    } finally {
      await Promise.all([revokeSPT(declinedSptId), revokeSPT(sptId)]);
    }
  });

  test('reports an SPT that needs authentication and keeps the session open', async () => {
    const orderId = await readySession();
    const sptId = await mintSPT({ paymentMethod: 'pm_card_authenticationRequired' });
    try {
      const authenticationRequired = await completeSession(orderId, sptId);
      assert.strictEqual(
        authenticationRequired.status,
        200,
        JSON.stringify(authenticationRequired.body),
      );
      assert.strictEqual(authenticationRequired.body.status, 'ready_for_payment');
      assert.deepStrictEqual(
        authenticationRequired.body.messages.map(({ type, code }) => ({ type, code })),
        [{ type: 'error', code: 'requires_3ds' }],
      );
    } finally {
      await revokeSPT(sptId);
    }
  });
});
