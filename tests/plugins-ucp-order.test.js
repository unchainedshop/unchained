import assert from 'node:assert';
import test from 'node:test';
import { createLoggedInGraphqlFetch, getServerBaseUrl, setupDatabase } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import { ucpPlatforms } from './setup.js';
import { assertCheckout, assertValid, messageCodes } from './ucp/checks.js';
import { digestOf, verifyWebhook } from './ucp/crypto.js';
import {
  CHECKOUT,
  DISCOUNT,
  FULFILLMENT,
  INVOICE,
  ORDER,
  startFakePlatform,
  waitFor,
} from './ucp/platform.js';

const capabilities = [CHECKOUT, FULFILLMENT, DISCOUNT, ORDER];
const buyer = { email: 'orders@unchained.local', first_name: 'Lea', last_name: 'Frei' };
const shipping = {
  methods: [
    {
      type: 'shipping',
      destinations: [
        {
          street_address: 'Limmatquai 2',
          address_locality: 'Zürich',
          postal_code: '8001',
          address_country: 'CH',
        },
      ],
    },
  ],
};
const pickup = { methods: [{ type: 'pickup', selected_destination_id: 'zurich' }] };
const line_items = [{ item: { id: 'simpleproduct' }, quantity: 2 }];

test.describe('UCP orders, webhooks and signatures', () => {
  let db;
  let platform;
  let graphqlFetchAsAdmin;
  let businessKeys;

  const registerPlatform = (options = {}) => {
    const hook = platform.webhook(options.statuses);
    const profile = platform.profile({ capabilities, handlers: [INVOICE], webhookUrl: hook.url });
    ucpPlatforms.push({
      profile: profile.url,
      username: 'admin',
      requireSignature: true,
      ...options.entry,
    });
    return { hook, profile, ucp: platform.client(profile.url, { token: ADMIN_TOKEN, signed: true }) };
  };

  const placeOrder = async (
    ucp,
    { fulfillment = shipping, handlerId = 'simple-payment-provider' } = {},
  ) => {
    const { body: checkout } = await ucp('POST', '/checkout-sessions', {
      line_items,
      buyer,
      fulfillment,
    });
    assert.equal(checkout.status, 'ready_for_complete');
    const { body } = await ucp('POST', `/checkout-sessions/${checkout.id}/complete`, {
      payment: { instruments: [{ id: 'invoice-1', handler_id: handlerId, type: 'invoice' }] },
    });
    assertCheckout(body);
    assert.equal(body.status, 'completed');
    return body;
  };

  const verified = (delivery) => {
    const components = verifyWebhook({ method: 'POST', ...delivery }, businessKeys);
    assert.ok(components, 'webhook signature');
    for (const component of [
      'ucp-agent',
      'content-digest',
      'content-type',
      'webhook-id',
      'webhook-timestamp',
    ]) {
      assert.ok(components.includes(component), `webhook signature covers ${component}`);
    }
    assert.equal(delivery.headers['ucp-agent'], `profile="${getServerBaseUrl()}/.well-known/ucp"`);
    assert.match(
      delivery.headers['webhook-id'],
      /^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    assert.match(delivery.headers['webhook-timestamp'], /^\d+$/);
    const order = JSON.parse(delivery.body);
    assertValid('order', order);
    return order;
  };

  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    platform = await startFakePlatform();
    businessKeys = (await (await fetch(`${getServerBaseUrl()}/.well-known/ucp`)).json()).keys;
  });

  test.after(async () => {
    ucpPlatforms.splice(0);
    await platform.close();
  });

  test('sends one signed webhook per order event and serves the order', async () => {
    const { hook, ucp } = registerPlatform();
    const checkout = await placeOrder(ucp);
    await waitFor(() => hook.received.length >= 2);
    const orders = hook.received.map(verified);
    assert.equal(new Set(hook.received.map(({ headers }) => headers['webhook-id'])).size, 2);
    assert.ok(orders.every(({ id, label }) => id === checkout.id && label === checkout.order.label));
    assert.deepEqual(orders[0].line_items[0].quantity, { original: 2, total: 2, fulfilled: 0 });
    assert.equal(orders[0].line_items[0].status, 'processing');

    const { errors } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation deliverOrder($orderId: ID!) {
          deliverOrder(orderId: $orderId) {
            _id
          }
        }
      `,
      variables: { orderId: checkout.id },
    });
    assert.equal(errors, undefined);
    await waitFor(() => hook.received.length >= 3);
    const delivered = verified(hook.received[2]);
    assert.equal(delivered.line_items[0].status, 'fulfilled');
    assert.equal(delivered.fulfillment.events[0].type, 'delivered');

    const { body } = await ucp('GET', `/orders/${checkout.id}`);
    assertValid('order', body);
    assert.deepEqual(body, delivered);
    assert.equal(hook.received.length, 3);
  });

  test('reports a rejected order as a cancellation', async () => {
    const { hook, ucp } = registerPlatform();
    const checkout = await placeOrder(ucp, {
      fulfillment: pickup,
      handlerId: 'prepaid-payment-provider',
    });
    await waitFor(() => hook.received.length >= 1);
    const { errors } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation rejectOrder($orderId: ID!) {
          rejectOrder(orderId: $orderId) {
            status
          }
        }
      `,
      variables: { orderId: checkout.id },
    });
    assert.equal(errors, undefined);
    const rejected = await waitFor(() =>
      hook.received.map(verified).find(({ adjustments }) => adjustments.length),
    );
    assert.equal(rejected.adjustments[0].type, 'cancellation');
    assert.equal(rejected.adjustments[0].totals[0].amount, -checkout.totals.at(-1).amount);
    assert.equal(rejected.line_items[0].status, 'removed');
  });

  test('retries a failed webhook with the same id, timestamp and bytes', async () => {
    const { hook, ucp } = registerPlatform({ statuses: [503] });
    await placeOrder(ucp);
    await waitFor(() => hook.received.length >= 3, { tries: 200 });
    const [failed] = hook.received;
    const retried = hook.received
      .slice(1)
      .find(({ headers }) => headers['webhook-id'] === failed.headers['webhook-id']);
    assert.ok(retried);
    assert.equal(retried.headers['webhook-timestamp'], failed.headers['webhook-timestamp']);
    assert.equal(retried.body, failed.body);
    verified(retried);
  });

  test('serves orders only to the registered platform that created them', async () => {
    const { ucp } = registerPlatform();
    const checkout = await placeOrder(ucp);
    const anonymous = platform.client(platform.profile({ capabilities }).url);
    const unauthorized = await anonymous('GET', `/orders/${checkout.id}`);
    assertValid('error', unauthorized.body);
    assert.deepEqual(messageCodes(unauthorized.body), ['unauthorized']);
    const { ucp: other } = registerPlatform();
    const foreign = await other('GET', `/orders/${checkout.id}`);
    assertValid('error', foreign.body);
    assert.deepEqual(messageCodes(foreign.body), ['not_found']);
  });

  test('verifies request signatures of registered platforms', async () => {
    const { profile } = registerPlatform();
    const ucp = platform.client(profile.url, { token: ADMIN_TOKEN });
    const body = { line_items };
    const cases = [
      [{}, 401, 'signature_missing'],
      [{ sign: { dsaEncoding: 'der' } }, 401, 'signature_invalid'],
      [{ sign: { digest: digestOf('{"line_items":[]}') } }, 400, 'digest_mismatch'],
      [
        {
          sign: {
            components: [
              '@method',
              '@authority',
              '@path',
              'ucp-agent',
              'content-digest',
              'content-type',
            ],
          },
        },
        401,
        'signature_invalid',
      ],
      [{ sign: { kid: 'unknown-key' } }, 401, 'key_not_found'],
    ];
    for (const [options, expectedStatus, code] of cases) {
      const response = await ucp('POST', '/checkout-sessions', body, options);
      assert.equal(response.status, expectedStatus, code);
      assert.equal(response.body.code, code);
    }
    const signed = await ucp('POST', '/checkout-sessions', body, { sign: {} });
    assert.equal(signed.status, 201);
  });

  test('binds the credentials to the platform profile', async () => {
    const { profile } = registerPlatform();
    const asUser = await platform.client(profile.url, { token: USER_TOKEN, signed: true })(
      'POST',
      '/checkout-sessions',
      { line_items },
    );
    assert.equal(asUser.status, 401);
    assert.equal(asUser.body.code, 'unauthorized');
    const impostor = await platform.client(platform.profile({ capabilities }).url, {
      token: ADMIN_TOKEN,
    })('POST', '/checkout-sessions', { line_items });
    assert.equal(impostor.status, 401);
    assert.equal(impostor.body.code, 'unauthorized');
    assert.equal(
      await db.collection('orders').countDocuments({ 'context.ucp.platform': profile.url }),
      0,
    );
  });
});
