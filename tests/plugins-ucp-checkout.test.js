import assert from 'node:assert';
import test from 'node:test';
import { createLoggedInGraphqlFetch, setupDatabase } from './helpers.js';
import { SimpleProduct } from './seeds/products.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import { assertCheckout, assertValid, messageCodes } from './ucp/checks.js';
import { INVOICE, startFakePlatform } from './ucp/platform.js';
import { charges, registerScriptedPsp, scriptedHandler, scriptedProvider } from './ucp/psp.js';

const buyer = {
  email: 'agent-buyer@unchained.local',
  first_name: 'Hans',
  last_name: 'Muster',
  phone_number: '+41791234567',
};
const address = {
  street_address: 'Bahnhofstrasse 1',
  address_locality: 'Zürich',
  postal_code: '8001',
  address_country: 'CH',
};
const shipping = { methods: [{ type: 'shipping', destinations: [{ id: 'home', ...address }] }] };
const pickup = { methods: [{ type: 'pickup', selected_destination_id: 'zurich' }] };
const lines = (...items) => items.map(([id, quantity]) => ({ item: { id }, quantity }));

test.describe('UCP checkout', () => {
  let db;
  let platform;
  let ucp;
  let scripted;
  let graphqlFetchAsAdmin;

  const ready = async (body) => {
    const created = await ucp('POST', '/checkout-sessions', {
      line_items: lines(['simpleproduct', 1]),
      ...body,
    });
    assert.equal(created.status, 201);
    return assertCheckout(created.body);
  };

  test.before(async () => {
    [db] = await setupDatabase();
    registerScriptedPsp();
    await db.collection('payment-providers').insertOne(scriptedProvider);
    await db.collection('products').insertOne({
      ...SimpleProduct,
      _id: 'ucp-reduced',
      slugs: ['ucp-reduced'],
      warehousing: { sku: 'UCP-REDUCED', baseUnit: 'ST' },
      tags: ['swiss-tax-category:reduced'],
      commerce: { pricing: [{ ...SimpleProduct.commerce.pricing[0], amount: 1550 }] },
    });
    graphqlFetchAsAdmin = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    platform = await startFakePlatform();
    ucp = platform.client(platform.profile({ handlers: [INVOICE] }).url);
    scripted = platform.client(platform.profile({ handlers: [scriptedHandler.name] }).url);
  });

  test.after(async () => {
    await platform.close();
  });

  test('builds a Swiss shipping checkout from create to ready_for_complete', async () => {
    const created = await ucp('POST', '/checkout-sessions', { line_items: lines(['simpleproduct', 2]) });
    assert.equal(created.status, 201);
    assertCheckout(created.body);
    assert.equal(created.body.status, 'incomplete');
    assert.deepEqual(
      created.body.messages.map(({ path }) => path),
      ['$.buyer.email', '$.fulfillment.methods[0].selected_destination_id'],
    );
    assert.equal(created.body.line_items[0].item.price, 10000);

    const { body } = await ucp('PUT', `/checkout-sessions/${created.body.id}`, {
      line_items: [{ ...created.body.line_items[0], quantity: 2 }],
      buyer,
      fulfillment: shipping,
    });
    assertCheckout(body);
    assert.equal(body.status, 'ready_for_complete');
    assert.deepEqual(body.buyer, buyer);
    const [method] = body.fulfillment.methods;
    assert.equal(method.selected_destination_id, 'home');
    assert.deepEqual(method.destinations, [
      { type: 'shipping_address', id: 'home', first_name: 'Hans', last_name: 'Muster', ...address },
    ]);
    assert.equal(method.groups[0].selected_option_id, 'simple-delivery-provider');
    assert.ok(method.groups[0].options.some(({ id }) => id === 'send-mail-delivery-provider'));
    assert.deepEqual(body.totals, [
      { type: 'subtotal', amount: 20000 },
      {
        type: 'total',
        amount: 20000,
        lines: [
          { display_text: 'Net', amount: 18501 },
          { display_text: 'VAT 8.1%', amount: 1499 },
        ],
      },
    ]);
    assert.deepEqual(Object.keys(body.ucp.payment_handlers), [INVOICE]);

    const order = await db.collection('orders').findOne({ _id: body.id });
    assert.equal(order.status, null);
    assert.equal(order.contact.emailAddress, buyer.email);
    assert.equal(order.billingAddress.city, 'Zürich');
  });

  test('replaces the line items and keeps omitted fields', async () => {
    const checkout = await ready({ buyer, fulfillment: shipping });
    const [line] = checkout.line_items;
    const { body } = await ucp('PUT', `/checkout-sessions/${checkout.id}`, {
      line_items: [
        { id: line.id, item: line.item, quantity: 3 },
        ...lines(['UCP-REDUCED', 1], ['simpleproduct', 1]),
      ],
    });
    assertCheckout(body);
    assert.deepEqual(
      body.line_items.map(({ item, quantity }) => [item.id, quantity]),
      [
        ['simpleproduct', 4],
        ['ucp-reduced', 1],
      ],
    );
    assert.deepEqual(body.buyer, buyer);
    assert.equal(body.fulfillment.methods[0].selected_destination_id, 'home');

    const replaced = await ucp('PUT', `/checkout-sessions/${checkout.id}`, {
      line_items: lines(['simpleproduct-2', 2]),
    });
    assert.deepEqual(
      replaced.body.line_items.map(({ item, quantity }) => [item.id, quantity]),
      [['simpleproduct-2', 2]],
    );
  });

  test('picks up in Zurich and refuses unknown pickup locations', async () => {
    const checkout = await ready({ buyer, fulfillment: pickup });
    assert.equal(checkout.status, 'ready_for_complete');
    const [method] = checkout.fulfillment.methods;
    assert.equal(method.type, 'pickup');
    assert.deepEqual(method.destinations, [{ type: 'business_location', id: 'zurich', name: 'Zurich' }]);
    assert.equal(method.selected_destination_id, 'zurich');
    assert.equal(method.groups[0].selected_option_id, 'pickup-delivery-provider');

    const refused = await ucp('PUT', `/checkout-sessions/${checkout.id}`, {
      line_items: lines(['simpleproduct', 5]),
      fulfillment: { methods: [{ type: 'pickup', selected_destination_id: 'bern' }] },
    });
    assertCheckout(refused.body);
    assert.deepEqual(refused.body.messages[0], {
      type: 'error',
      code: 'invalid',
      content: 'This pickup location is not available',
      severity: 'recoverable',
      path: '$.fulfillment.methods[0].selected_destination_id',
    });
    assert.equal(refused.body.line_items[0].quantity, 1);
    assert.equal(refused.body.fulfillment.methods[0].selected_destination_id, 'zurich');
  });

  test('applies discount codes and reports the invalid ones', async () => {
    const checkout = await ready({ buyer, fulfillment: shipping });
    const { body } = await ucp('PUT', `/checkout-sessions/${checkout.id}`, {
      line_items: lines(['simpleproduct', 2]),
      discounts: { codes: ['HALFPRICE', 'NOPE'] },
    });
    assertCheckout(body);
    assert.deepEqual(body.discounts.codes, ['HALFPRICE', 'NOPE']);
    assert.deepEqual(body.discounts.applied, [
      { code: 'HALFPRICE', title: 'HALFPRICE', amount: 10000, automatic: false },
    ]);
    assert.deepEqual(body.line_items[0].totals, [
      { type: 'subtotal', amount: 20000 },
      { type: 'items_discount', amount: -10000 },
      { type: 'total', amount: 10000 },
    ]);
    assert.deepEqual(
      body.totals.map(({ type, amount }) => [type, amount]),
      [
        ['subtotal', 20000],
        ['items_discount', -10000],
        ['total', 10000],
      ],
    );
    assert.deepEqual(
      body.messages.find(({ code }) => code === 'discount_code_invalid'),
      {
        type: 'warning',
        code: 'discount_code_invalid',
        content: 'The code NOPE cannot be applied',
        path: '$.discounts.codes[1]',
      },
    );

    const cleared = await ucp('PUT', `/checkout-sessions/${checkout.id}`, {
      line_items: lines(['simpleproduct', 2]),
      discounts: { codes: [] },
    });
    assert.deepEqual(cleared.body.discounts, { codes: [], applied: [] });
    assert.equal(cleared.body.totals.at(-1).amount, 20000);
  });

  test('reports unorderable products as recoverable item_unavailable', async () => {
    const { body } = await ucp('POST', '/checkout-sessions', {
      line_items: lines(['simpleproduct_draft', 1], ['simpleproduct', 1], ['unknown-product', 1]),
    });
    assertCheckout(body);
    assert.deepEqual(
      body.line_items.map(({ item }) => item.id),
      ['simpleproduct'],
    );
    assert.deepEqual(
      body.messages.filter(({ code }) => code === 'item_unavailable').map(({ path }) => path),
      ['$.line_items[0]', '$.line_items[2]'],
    );
  });

  test('cancels a checkout once and keeps it closed', async () => {
    const checkout = await ready({ buyer });
    const canceled = await ucp('POST', `/checkout-sessions/${checkout.id}/cancel`, {});
    assertCheckout(canceled.body);
    assert.equal(canceled.body.status, 'canceled');
    const again = await ucp('POST', `/checkout-sessions/${checkout.id}/cancel`, {});
    assert.deepEqual(messageCodes(again.body), ['checkout_closed']);
    const update = await ucp('PUT', `/checkout-sessions/${checkout.id}`, {
      line_items: lines(['simpleproduct', 2]),
    });
    assert.equal(update.body.status, 'canceled');
    assert.equal(update.body.line_items[0].quantity, 1);
  });

  test('hides checkouts of other platforms', async () => {
    const checkout = await ready({ buyer });
    const other = platform.client(platform.profile({ handlers: [INVOICE] }).url);
    const { status, body } = await other('GET', `/checkout-sessions/${checkout.id}`);
    assert.equal(status, 200);
    assertValid('error', body);
    assert.deepEqual(messageCodes(body), ['not_found']);
  });

  test('itemizes Swiss VAT per rate and matches the engine totals', async () => {
    const checkout = await ready({
      line_items: lines(['simpleproduct', 1], ['ucp-reduced', 3]),
      buyer,
      fulfillment: shipping,
    });
    const {
      data: { order },
    } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        query order($orderId: ID!) {
          order(orderId: $orderId) {
            total {
              amount
            }
            taxes: total(category: TAXES) {
              amount
            }
            items: total(category: ITEMS) {
              amount
            }
          }
        }
      `,
      variables: { orderId: checkout.id },
    });
    const total = checkout.totals.at(-1);
    assert.equal(total.amount, order.total.amount);
    assert.equal(total.amount, 10000 + 3 * 1550);
    assert.deepEqual(
      total.lines.map(({ display_text }) => display_text),
      ['Net', 'VAT 8.1%', 'VAT 2.6%'],
    );
    assert.equal(total.lines[1].amount + total.lines[2].amount, order.taxes.amount);
    assert.equal(checkout.totals[0].amount, order.items.amount);

    const discounted = await ucp('PUT', `/checkout-sessions/${checkout.id}`, {
      line_items: lines(['simpleproduct', 1], ['ucp-reduced', 3]),
      discounts: { codes: ['100OFF'] },
    });
    assertCheckout(discounted.body);
    const {
      data: { order: discountedOrder },
    } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        query order($orderId: ID!) {
          order(orderId: $orderId) {
            total {
              amount
            }
            taxes: total(category: TAXES) {
              amount
            }
            discounts: total(category: DISCOUNTS) {
              amount
            }
          }
        }
      `,
      variables: { orderId: checkout.id },
    });
    const discountedTotal = discounted.body.totals.at(-1);
    assert.equal(discountedTotal.amount, discountedOrder.total.amount);
    assert.deepEqual(discountedTotal.lines, [
      { display_text: 'Net', amount: discountedOrder.total.amount - discountedOrder.taxes.amount },
      { display_text: 'VAT', amount: discountedOrder.taxes.amount },
    ]);
    assert.equal(
      discounted.body.totals.find(({ type }) => type === 'discount').amount,
      discountedOrder.discounts.amount,
    );
  });

  test('completes an invoice checkout into a confirmed order', async () => {
    const checkout = await ready({ buyer, fulfillment: shipping });
    const instrument = { id: 'invoice-1', handler_id: 'simple-payment-provider', type: 'invoice' };
    const { status, body } = await ucp('POST', `/checkout-sessions/${checkout.id}/complete`, {
      payment: { instruments: [instrument] },
    });
    assert.equal(status, 200);
    assertCheckout(body);
    assert.equal(body.status, 'completed');
    const order = await db.collection('orders').findOne({ _id: checkout.id });
    assert.equal(order.status, 'CONFIRMED');
    assert.deepEqual(body.order, {
      id: checkout.id,
      label: order.orderNumber,
      permalink_url: `http://localhost:4010/order?_id=${checkout.id}`,
    });
    const again = await ucp('GET', `/checkout-sessions/${checkout.id}`);
    assert.equal(again.body.status, 'completed');
  });

  test('completes a prepaid invoice as a pending order that settles later', async () => {
    const checkout = await ready({ buyer, fulfillment: shipping });
    const { body } = await ucp('POST', `/checkout-sessions/${checkout.id}/complete`, {
      payment: {
        instruments: [{ id: 'prepaid-1', handler_id: 'prepaid-payment-provider', type: 'invoice' }],
      },
    });
    assertCheckout(body);
    assert.equal(body.status, 'completed');
    const pending = await db.collection('orders').findOne({ _id: checkout.id });
    assert.equal(pending.status, 'PENDING');
    assert.equal(
      (await db.collection('order_payments').findOne({ _id: pending.paymentId })).status,
      null,
    );

    const { errors } = await graphqlFetchAsAdmin({
      query: /* GraphQL */ `
        mutation payOrder($orderId: ID!) {
          payOrder(orderId: $orderId) {
            status
          }
        }
      `,
      variables: { orderId: checkout.id },
    });
    assert.equal(errors, undefined);
    assert.equal((await db.collection('orders').findOne({ _id: checkout.id })).status, 'CONFIRMED');
    assert.equal((await ucp('GET', `/checkout-sessions/${checkout.id}`)).body.status, 'completed');
  });

  test('turns a declined payment into a recoverable message and replays it without a new charge', async () => {
    const checkout = (
      await scripted('POST', '/checkout-sessions', {
        line_items: lines(['simpleproduct', 1]),
        buyer,
        fulfillment: shipping,
      })
    ).body;
    assert.equal(checkout.status, 'ready_for_complete');
    const request = {
      payment: {
        instruments: [
          {
            id: 'card-1',
            handler_id: 'ucp-scripted-provider',
            type: 'card',
            credential: { type: 'token', token: 'decline' },
          },
        ],
      },
    };
    const before = charges.length;
    const declined = await scripted('POST', `/checkout-sessions/${checkout.id}/complete`, request, {
      key: 'decline-once',
    });
    assertCheckout(declined.body, { secrets: ['decline'] });
    assert.equal(declined.body.status, 'ready_for_complete');
    assert.deepEqual(
      declined.body.messages.find(({ code }) => code === 'payment_failed'),
      {
        type: 'error',
        code: 'payment_failed',
        content:
          'The payment failed, retry with another instrument or continue on the merchant checkout',
        severity: 'recoverable',
        path: '$.payment.instruments[0]',
      },
    );
    const replay = await scripted('POST', `/checkout-sessions/${checkout.id}/complete`, request, {
      key: 'decline-once',
    });
    assert.deepEqual(replay.body, declined.body);
    assert.equal(charges.length, before + 1);
    assert.equal((await db.collection('orders').findOne({ _id: checkout.id })).orderNumber, undefined);

    const retried = await scripted('POST', `/checkout-sessions/${checkout.id}/complete`, {
      payment: {
        instruments: [
          { ...request.payment.instruments[0], credential: { type: 'token', token: 'paid-4242' } },
        ],
      },
    });
    assertCheckout(retried.body, { secrets: ['paid-4242'] });
    assert.equal(retried.body.status, 'completed');
  });

  test('declines a payment that needs 3DS and hands off without an Action', async () => {
    const checkout = (
      await scripted('POST', '/checkout-sessions', {
        line_items: lines(['simpleproduct', 1]),
        buyer,
        fulfillment: shipping,
      })
    ).body;
    const { body } = await scripted('POST', `/checkout-sessions/${checkout.id}/complete`, {
      payment: {
        instruments: [
          {
            id: 'card-1',
            handler_id: 'ucp-scripted-provider',
            type: 'card',
            credential: { type: 'token', token: 'challenge' },
          },
        ],
      },
    });
    assertCheckout(body);
    assert.equal(body.status, 'ready_for_complete');
    assert.ok(messageCodes(body).includes('payment_failed'));
    assert.ok(body.continue_url);
    const order = await db.collection('orders').findOne({ _id: checkout.id });
    assert.equal(order.status, null);
    assert.equal(order.orderNumber, undefined);
  });

  test('refuses unknown handlers and more than one instrument', async () => {
    const checkout = await ready({ buyer, fulfillment: shipping });
    const instrument = { id: 'invoice-1', handler_id: 'simple-payment-provider', type: 'invoice' };
    const unknown = await ucp('POST', `/checkout-sessions/${checkout.id}/complete`, {
      payment: { instruments: [{ ...instrument, handler_id: 'ucp-scripted-provider' }] },
    });
    assert.equal(unknown.body.status, 'ready_for_complete');
    assert.equal(unknown.body.messages[0].path, '$.payment.instruments[0].handler_id');
    const two = await ucp('POST', `/checkout-sessions/${checkout.id}/complete`, {
      payment: { instruments: [instrument, { ...instrument, id: 'invoice-2' }] },
    });
    assert.equal(two.body.messages[0].path, '$.payment.instruments');
    assert.equal((await db.collection('orders').findOne({ _id: checkout.id })).status, null);
  });

  test('replays requests by Idempotency-Key and refuses a reused key with another body', async () => {
    const create = { line_items: lines(['simpleproduct', 1]), buyer };
    const first = await ucp('POST', '/checkout-sessions', create, { key: 'create-once' });
    const replay = await ucp('POST', '/checkout-sessions', create, { key: 'create-once' });
    assert.equal(replay.status, 201);
    assert.deepEqual(replay.body, first.body);
    assert.equal(await db.collection('orders').countDocuments({ _id: first.body.id }), 1);

    const conflict = await ucp(
      'POST',
      '/checkout-sessions',
      { ...create, buyer: {} },
      { key: 'create-once' },
    );
    assert.equal(conflict.status, 409);
    assert.equal(conflict.body.code, 'idempotency_conflict');
  });

  test('creates one checkout for concurrent requests with the same key', async () => {
    const create = { line_items: lines(['simpleproduct', 1]) };
    const results = await Promise.all(
      [1, 2, 3].map(() => ucp('POST', '/checkout-sessions', create, { key: 'create-concurrently' })),
    );
    const created = results.filter(({ status }) => status === 201);
    assert.ok(created.length >= 1);
    assert.equal(new Set(created.map(({ body }) => body.id)).size, 1);
    assert.ok(
      results.every(({ status, body }) => status === 201 || body.code === 'request_in_progress'),
    );
  });

  test('charges once for concurrent completes', async () => {
    const checkout = (
      await scripted('POST', '/checkout-sessions', {
        line_items: lines(['simpleproduct', 1]),
        buyer,
        fulfillment: shipping,
      })
    ).body;
    const before = charges.length;
    const results = await Promise.all(
      [1, 2, 3].map((attempt) =>
        scripted('POST', `/checkout-sessions/${checkout.id}/complete`, {
          payment: {
            instruments: [
              {
                id: `card-${attempt}`,
                handler_id: 'ucp-scripted-provider',
                type: 'card',
                credential: { type: 'token', token: 'paid-concurrent' },
              },
            ],
          },
        }),
      ),
    );
    assert.ok(results.every(({ status, body }) => body.status === 'completed' || status === 409));
    assert.equal(charges.length, before + 1);
    assert.equal((await db.collection('orders').findOne({ _id: checkout.id })).status, 'CONFIRMED');
  });

  test('serializes parallel updates of one checkout', async () => {
    const checkout = await ready({ buyer });
    const results = await Promise.all(
      [2, 3, 4].map((quantity) =>
        ucp('PUT', `/checkout-sessions/${checkout.id}`, {
          line_items: lines(['simpleproduct', quantity]),
        }),
      ),
    );
    assert.ok(results.every(({ status }) => status === 200 || status === 409));
    const positions = await db.collection('order_positions').find({ orderId: checkout.id }).toArray();
    assert.equal(positions.length, 1);
    assert.ok([2, 3, 4].includes(positions[0].quantity));
  });
});
