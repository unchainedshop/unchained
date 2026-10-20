import assert from 'node:assert';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import {
  createLoggedInGraphqlFetch,
  getServerBaseUrl,
  setupDatabase,
  tokenCookieOf,
} from './helpers.js';
import { SimplePaymentProvider } from './seeds/payments.js';
import { assertCheckout, messageCodes } from './ucp/checks.js';
import { startFakePlatform } from './ucp/platform.js';

const buyer = { email: 'handoff@unchained.local', first_name: 'Anna', last_name: 'Meier' };
const pickup = { methods: [{ type: 'pickup', selected_destination_id: 'zurich' }] };

const datatransWebhook = async ({ orderPaymentId, userId }) => {
  const body = JSON.stringify({
    currency: 'CHF',
    refno: Buffer.from(orderPaymentId, 'hex').toString('base64'),
    refno2: userId,
    status: 'authorized',
    transactionId: 'payment_authorized',
    type: 'payment',
  });
  const timestamp = '1760000000';
  const signature = createHmac('sha256', Buffer.from('1337', 'hex'))
    .update(timestamp + body)
    .digest('hex');
  return fetch(`${getServerBaseUrl()}/payment/datatrans/webhook`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'datatrans-signature': `t=${timestamp},s0=${signature}`,
    },
    body,
  });
};

test.describe('UCP escalation and storefront handoff', () => {
  let db;
  let platform;
  let ucp;

  test.before(async () => {
    [db] = await setupDatabase();
    await db.collection('payment-providers').insertOne({
      ...SimplePaymentProvider,
      _id: 'd4d4d4d4d4',
      adapterKey: 'shop.unchained.datatrans',
      type: 'GENERIC',
      configuration: [{ key: 'merchantId', value: '1100004624' }],
    });
    platform = await startFakePlatform();
    ucp = platform.client(platform.profile({ handlers: [] }).url);
  });

  test.after(async () => {
    await platform.close();
  });

  test('escalates every checkout to the merchant when the platform has no usable payment handler', async () => {
    const created = await ucp('POST', '/checkout-sessions', {
      line_items: [{ item: { id: 'simpleproduct' }, quantity: 1 }],
    });
    assertCheckout(created.body);
    assert.equal(created.body.status, 'requires_escalation');
    assert.deepEqual(created.body.ucp.payment_handlers, {});
    assert.ok(messageCodes(created.body).includes('payment_required'));
    assert.ok(messageCodes(created.body).includes('missing'));

    const fetched = await ucp('GET', `/checkout-sessions/${created.body.id}`);
    assert.equal(fetched.body.status, 'requires_escalation');
    const updated = await ucp('PUT', `/checkout-sessions/${created.body.id}`, {
      line_items: [{ item: { id: 'simpleproduct' }, quantity: 2 }],
      buyer,
      fulfillment: pickup,
    });
    assertCheckout(updated.body);
    assert.equal(updated.body.status, 'requires_escalation');
    assert.deepEqual(messageCodes(updated.body), ['payment_required']);
    assert.equal(updated.body.messages[0].severity, 'requires_buyer_input');
  });

  test('hands the cart to the storefront, which places it through Datatrans', async () => {
    const { body: checkout } = await ucp('POST', '/checkout-sessions', {
      line_items: [{ item: { id: 'simpleproduct' }, quantity: 3 }],
      buyer,
      fulfillment: pickup,
    });
    assert.equal(checkout.status, 'requires_escalation');
    assert.equal(checkout.totals.at(-1).amount, 30000);

    const handoff = await fetch(checkout.continue_url, { redirect: 'manual' });
    assert.equal(handoff.status, 303);
    assert.equal(handoff.headers.get('location'), 'http://localhost:4010/checkout');
    assert.equal(handoff.headers.get('referrer-policy'), 'no-referrer');
    assert.equal(handoff.headers.get('cache-control'), 'no-store');
    const storefront = createLoggedInGraphqlFetch(`Bearer ${tokenCookieOf(handoff.headers)}`);

    const { data, errors } = await storefront({
      query: /* GraphQL */ `
        mutation selectDatatrans($orderId: ID!) {
          updateCart(orderId: $orderId, paymentProviderId: "d4d4d4d4d4") {
            _id
            user {
              _id
              isGuest
            }
          }
        }
      `,
      variables: { orderId: checkout.id },
    });
    assert.equal(errors, undefined);
    assert.equal(data.updateCart._id, checkout.id);
    assert.equal(data.updateCart.user.isGuest, true);

    const cart = await db.collection('orders').findOne({ _id: checkout.id });
    const webhook = await datatransWebhook({ orderPaymentId: cart.paymentId, userId: cart.userId });
    assert.equal(webhook.status, 200);

    const { body } = await ucp('GET', `/checkout-sessions/${checkout.id}`);
    assertCheckout(body);
    assert.equal(body.status, 'completed');
    const order = await db.collection('orders').findOne({ _id: checkout.id });
    assert.equal(body.order.label, order.orderNumber);
    assert.equal(
      (await db.collection('order_payments').findOne({ _id: order.paymentId })).status,
      'PAID',
    );
  });

  test('refuses forged, expired and closed handoffs', async () => {
    const { body: checkout } = await ucp('POST', '/checkout-sessions', {
      line_items: [{ item: { id: 'simpleproduct' }, quantity: 1 }],
    });
    const [base, token] = checkout.continue_url.split('/continue/');
    const [expires, signature] = token.split('.');
    const forged = await fetch(`${base}/continue/${expires}.${signature.slice(1)}x`, {
      redirect: 'manual',
    });
    assert.equal(forged.status, 404);
    assert.equal(forged.headers.get('set-cookie'), null);
    const expired = await fetch(`${base}/continue/${Number(expires) - 7 * 60 * 60}.${signature}`, {
      redirect: 'manual',
    });
    assert.equal(expired.status, 404);

    await ucp('POST', `/checkout-sessions/${checkout.id}/cancel`, {});
    const closed = await fetch(checkout.continue_url, { redirect: 'manual' });
    assert.equal(closed.status, 404);
  });
});
