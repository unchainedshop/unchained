import assert from 'node:assert';
import test from 'node:test';
import { setupDatabase, disconnect, getServerBaseUrl } from './helpers.js';

// Real end-to-end ACP Shared Payment Token charge. Guarded on STRIPE_SECRET (like
// plugins-stripe.test.js) — it mints a REAL test SPT via Stripe's test-helper and
// charges it, so it only runs when a real sk_test_ key is provided (never in the
// hermetic CI default where STRIPE_SECRET is empty).
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

const mintSPT = async ({ currency = 'chf', maxAmount = 1000000 } = {}) => {
  const res = await fetch('https://api.stripe.com/v1/test_helpers/shared_payment/granted_tokens', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${STRIPE_SECRET}`,
      'stripe-version': SPT_STRIPE_VERSION,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: stripeForm({
      payment_method: 'pm_card_visa',
      'usage_limits[currency]': currency,
      'usage_limits[max_amount]': maxAmount,
      'usage_limits[expires_at]': Math.floor(Date.now() / 1000) + 3600,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`SPT mint failed (${res.status}): ${JSON.stringify(json)}`);
  return json.id;
};

const revokeSPT = async (id) => {
  await fetch(`https://api.stripe.com/v1/test_helpers/shared_payment/granted_tokens/${id}/revoke`, {
    method: 'POST',
    headers: { authorization: `Bearer ${STRIPE_SECRET}`, 'stripe-version': SPT_STRIPE_VERSION },
  }).catch(() => undefined);
};

test.describe('Plugins: ACP Shared Payment Token charge (real Stripe)', () => {
  if (!STRIPE_SECRET) return;

  let db;

  test.before(async () => {
    [db] = await setupDatabase();
    baseUrl = getServerBaseUrl();
    // Point the configured ACP provider (UNCHAINED_ACP_PAYMENT_PROVIDER_ID=acp-test-provider)
    // at the real Stripe adapter for this run (STRIPE_SECRET is set via .env, so it registers).
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
    // 1. create session
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
    const session = await created.json();
    const orderId = session.id;

    // 2. set buyer + shipping address
    await acpFetch(`/acp/checkout_sessions/${orderId}`, {
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

    // 3. select the first supported fulfillment option (delivery provider)
    const withOptions = await (await acpFetch(`/acp/checkout_sessions/${orderId}`)).json();
    assert.ok(withOptions.fulfillment_options.length > 0, 'expected a supported delivery provider');
    const optionId = withOptions.fulfillment_options[0].id;
    await acpFetch(`/acp/checkout_sessions/${orderId}`, {
      method: 'POST',
      idempotencyKey: idem(),
      body: {
        selected_fulfillment_options: [
          {
            type: withOptions.fulfillment_options[0].type,
            option_id: optionId,
            item_ids: withOptions.line_items.map((item) => item.id),
          },
        ],
      },
    });

    // 4. mint a real test SPT and complete the checkout with it
    const sptId = await mintSPT({ currency: 'chf' });
    try {
      const completed = await acpFetch(`/acp/checkout_sessions/${orderId}/complete`, {
        method: 'POST',
        idempotencyKey: idem(),
        body: {
          buyer: { email: 'agent-buyer@example.com' },
          payment_data: {
            handler_id: 'stripe_spt',
            instrument: { type: 'card', credential: { type: 'spt', token: sptId } },
          },
        },
      });
      const completedBody = await completed.json();
      assert.strictEqual(completed.status, 200, JSON.stringify(completedBody));
      assert.strictEqual(completedBody.status, 'completed');
      assert.ok(['confirmed', 'completed'].includes(completedBody.order.status));

      // 5. the SPT charge landed on the order payment without persisting the bearer credential
      const orderDoc = await db.collection('orders').findOne({ _id: orderId });
      const orderPayment = await db.collection('order_payments').findOne({ _id: orderDoc.paymentId });
      assert.ok(orderPayment, `no active order payment for order ${orderId}`);
      assert.strictEqual(orderPayment.status, 'PAID', `orderPayment=${JSON.stringify(orderPayment)}`);
      assert.match(orderPayment.transactionId, /^pi_/);
      const serialized = JSON.stringify(orderPayment);
      assert.ok(!serialized.includes(sptId), 'shared payment credentials must not be persisted');
      assert.ok(serialized.includes(SPT_STRIPE_VERSION), 'expected the SPT api version in the evidence');
    } finally {
      await revokeSPT(sptId);
    }
  });
});
