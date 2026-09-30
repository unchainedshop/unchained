import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import { RendererTypes } from '@unchainedshop/ticketing';
import { registerRenderer } from '@unchainedshop/ticketing/lib/template-registry.js';
import {
  setupDatabase,
  createAnonymousGraphqlFetch,
  createLoggedInGraphqlFetch,
  getServerBaseUrl,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import seedTicketing, {
  ConcertEventId,
  GATE_TOKEN,
  TheaterEventId,
  buyTickets,
} from './seeds/ticketing.js';

const ADD_TICKETS = /* GraphQL */ `
  mutation AddTickets($orderId: ID, $productId: ID!, $quantity: Int) {
    addCartProduct(orderId: $orderId, productId: $productId, quantity: $quantity) {
      _id
      quantity
    }
  }
`;

const ORDER_MAGIC_KEY = /* GraphQL */ `
  query OrderMagicKey($orderId: ID!, $variant: String) {
    order(orderId: $orderId) {
      _id
      magicKey
      ticketsPdfUrl(variant: $variant)
    }
  }
`;

test.describe('Ticketing: checkout', () => {
  let db;
  let userFetch;
  let adminFetch;

  const createCart = async (orderNumber: string) => {
    const { data, errors } = await userFetch({
      query: /* GraphQL */ `
        mutation CreateCart($orderNumber: String!) {
          createCart(orderNumber: $orderNumber) {
            _id
          }
        }
      `,
      variables: { orderNumber },
    });
    assert.ifError(errors?.[0]);
    return data.createCart._id as string;
  };

  const addTickets = (orderId: string, productId: string, quantity: number) =>
    userFetch({ query: ADD_TICKETS, variables: { orderId, productId, quantity } });

  test.before(async () => {
    [db] = await setupDatabase();
    await seedTicketing(db);
    userFetch = createLoggedInGraphqlFetch(USER_TOKEN);
    adminFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test('checkout issues one ticket per seat with serials and the attendee names of the order', async () => {
    const { order, tickets } = await buyTickets(userFetch, {
      orderNumber: 'tickets-attendees',
      positions: [{ productId: ConcertEventId, quantity: 2 }],
      attendees: ['Ada Lovelace', 'Alan Turing'],
    });

    const bySerial = [...tickets].sort(
      (a, b) => Number(a.tokenSerialNumber) - Number(b.tokenSerialNumber),
    );
    assert.deepEqual(
      bySerial.map(({ tokenSerialNumber, quantity, attendeeName, ticketStatus }) => ({
        tokenSerialNumber,
        quantity,
        attendeeName,
        ticketStatus,
      })),
      [
        { tokenSerialNumber: '1', quantity: 1, attendeeName: 'Ada Lovelace', ticketStatus: 'VALID' },
        { tokenSerialNumber: '2', quantity: 1, attendeeName: 'Alan Turing', ticketStatus: 'VALID' },
      ],
    );
    assert.ok(
      tickets.every(({ user, product }) => user._id === 'user' && product._id === ConcertEventId),
    );

    // Exactly one VIRTUAL provider issues tickets, and each ticket references its order
    const stored = await db.collection('token_surrogates').find({ productId: ConcertEventId }).toArray();
    assert.equal(stored.length, 2);
    assert.ok(stored.every(({ meta }) => meta.orderId === order._id));
    assert.ok(stored.every(({ contractAddress, chainId }) => !contractAddress && !chainId));
  });

  test('tickets without attendee names have no attendeeName, serials continue', async () => {
    const { tickets } = await buyTickets(userFetch, {
      orderNumber: 'tickets-anonymous',
      positions: [{ productId: ConcertEventId, quantity: 1 }],
    });
    assert.equal(tickets.length, 1);
    assert.equal(tickets[0].tokenSerialNumber, '3');
    assert.equal(tickets[0].attendeeName, null);
  });

  test('the validator counts issued tickets and PENDING orders against the supply', async () => {
    // Supply 5, three tickets issued; a PENDING order holds another seat
    await db.collection('orders').insertOne({
      _id: 'ticket-pending-order',
      status: 'PENDING',
      userId: 'admin',
      currencyCode: 'CHF',
      countryCode: 'CH',
      created: new Date(),
    });
    await db.collection('order_positions').insertOne({
      _id: 'ticket-pending-position',
      orderId: 'ticket-pending-order',
      productId: ConcertEventId,
      quantity: 1,
      created: new Date(),
    });

    const cartId = await createCart('tickets-supply');
    const first = await addTickets(cartId, ConcertEventId, 1);
    assert.ifError(first.errors?.[0]);

    const soldOut = await addTickets(cartId, ConcertEventId, 1);
    assert.equal(soldOut.errors?.[0]?.extensions?.code, 'TicketSoldOutError');
    assert.equal(soldOut.errors?.[0]?.extensions?.available, 0);

    // Checkout re-checks the supply against orders that went PENDING in the meantime
    await db
      .collection('order_positions')
      .updateOne({ _id: 'ticket-pending-position' }, { $set: { quantity: 2 } });
    const { errors: checkoutErrors } = await userFetch({
      query: /* GraphQL */ `
        mutation Checkout($orderId: ID) {
          checkoutCart(orderId: $orderId) {
            _id
          }
        }
      `,
      variables: { orderId: cartId },
    });
    assert.equal(checkoutErrors?.[0]?.extensions?.code, 'OrderCheckoutError');
    assert.equal(checkoutErrors?.[0]?.extensions?.detailCode, 'TicketSoldOutError');

    // A rejected order frees its seats again
    await db
      .collection('orders')
      .updateOne({ _id: 'ticket-pending-order' }, { $set: { status: 'REJECTED' } });
    const freed = await addTickets(cartId, ConcertEventId, 1);
    assert.ifError(freed.errors?.[0]);
  });

  test('a cancelled event is not sold', async () => {
    await db
      .collection('products')
      .updateOne({ _id: TheaterEventId }, { $set: { 'meta.cancelled': true } });
    try {
      const cartId = await createCart('tickets-cancelled-event');
      const { errors } = await addTickets(cartId, TheaterEventId, 1);
      assert.equal(errors?.[0]?.extensions?.code, 'TicketEventCancelledError');
    } finally {
      await db
        .collection('products')
        .updateOne({ _id: TheaterEventId }, { $unset: { 'meta.cancelled': 1 } });
    }
  });

  test('the built-in sale rules (product.meta.saleRules)', async () => {
    const cartId = await createCart('tickets-sale-rules');
    const setSaleRules = (saleRules) =>
      db
        .collection('products')
        .updateOne({ _id: TheaterEventId }, { $set: { 'meta.saleRules': saleRules } });
    const day = 24 * 60 * 60 * 1000;
    try {
      await setSaleRules({ onSale: false });
      let result = await addTickets(cartId, TheaterEventId, 1);
      assert.equal(result.errors?.[0]?.extensions?.code, 'TicketNotOnSaleError');

      await setSaleRules({ salesStart: new Date(Date.now() + day).toISOString() });
      result = await addTickets(cartId, TheaterEventId, 1);
      assert.equal(result.errors?.[0]?.extensions?.code, 'TicketSaleNotStartedError');

      await setSaleRules({ salesEnd: new Date(Date.now() - day) });
      result = await addTickets(cartId, TheaterEventId, 1);
      assert.equal(result.errors?.[0]?.extensions?.code, 'TicketSaleEndedError');

      await setSaleRules({ maxPerOrder: 2, salesStart: new Date(Date.now() - day) });
      result = await addTickets(cartId, TheaterEventId, 2);
      assert.ifError(result.errors?.[0]);
      result = await addTickets(cartId, TheaterEventId, 1);
      assert.equal(result.errors?.[0]?.extensions?.code, 'TicketOrderLimitExceededError');
      assert.equal(result.errors?.[0]?.extensions?.maxPerOrder, 2);
    } finally {
      await db
        .collection('products')
        .updateOne({ _id: TheaterEventId }, { $unset: { 'meta.saleRules': 1 } });
    }
  });

  test.describe('Order.magicKey and Order.ticketsPdfUrl', () => {
    let orderId: string;
    let magicKey: string;

    test.before(async () => {
      const { order } = await buyTickets(userFetch, {
        orderNumber: 'tickets-magic-key',
        positions: [{ productId: TheaterEventId, quantity: 1 }],
      });
      orderId = order._id;
    });

    test('the owner gets the magic key; without a PDF renderer there is no PDF link', async () => {
      const { data, errors } = await userFetch({ query: ORDER_MAGIC_KEY, variables: { orderId } });
      assert.ifError(errors?.[0]);
      assert.match(data.order.magicKey, /^[a-f\d]{64}$/);
      assert.equal(data.order.ticketsPdfUrl, null);
      magicKey = data.order.magicKey;
    });

    test('with a PDF renderer the link carries the magic key as otp', async () => {
      registerRenderer(RendererTypes.ORDER_PDF, async () => Readable.from(['%PDF-1.4 stub']));
      try {
        const { data, errors } = await userFetch({
          query: ORDER_MAGIC_KEY,
          variables: { orderId, variant: 'receipt' },
        });
        assert.ifError(errors?.[0]);
        const url = new URL(data.order.ticketsPdfUrl);
        assert.equal(`${url.origin}${url.pathname}`, `${getServerBaseUrl()}/rest/print_tickets`);
        assert.equal(url.searchParams.get('orderId'), orderId);
        assert.equal(url.searchParams.get('otp'), magicKey);
        assert.equal(url.searchParams.get('variant'), 'receipt');
      } finally {
        registerRenderer(RendererTypes.ORDER_PDF, null);
      }
    });

    test('administrators get the magic key, other users only when they present it', async () => {
      const admin = await adminFetch({ query: ORDER_MAGIC_KEY, variables: { orderId } });
      assert.ifError(admin.errors?.[0]);
      assert.equal(admin.data.order.magicKey, magicKey);

      // Gate staff may not see the order at all
      const gate = await createLoggedInGraphqlFetch(GATE_TOKEN)({
        query: ORDER_MAGIC_KEY,
        variables: { orderId },
      });
      assert.equal(gate.errors?.[0]?.extensions?.code, 'NoPermissionError');

      // Anybody presenting the key opens the order and reads the key back
      const anonymous = createAnonymousGraphqlFetch();
      const withKey = await anonymous({
        query: ORDER_MAGIC_KEY,
        variables: { orderId },
        headers: { 'x-magic-key': magicKey },
      });
      assert.ifError(withKey.errors?.[0]);
      assert.equal(withKey.data.order.magicKey, magicKey);

      const wrongKey = await anonymous({
        query: ORDER_MAGIC_KEY,
        variables: { orderId },
        headers: { 'x-magic-key': 'f'.repeat(64) },
      });
      assert.equal(wrongKey.errors?.[0]?.extensions?.code, 'NoPermissionError');
    });

    test('tickets link their order for the buyer and administrators, not for gate staff', async () => {
      const EVENT_TICKET_ORDERS = /* GraphQL */ `
        query EventTicketOrders($productId: ID!) {
          product(productId: $productId) {
            ... on TokenizedProduct {
              tokens {
                _id
                order {
                  _id
                  orderNumber
                }
              }
            }
          }
        }
      `;
      const admin = await adminFetch({
        query: EVENT_TICKET_ORDERS,
        variables: { productId: TheaterEventId },
      });
      assert.ifError(admin.errors?.[0]);
      const ticketsOfOrder = admin.data.product.tokens.filter(({ order }) => order?._id === orderId);
      assert.equal(ticketsOfOrder.length, 1);
      assert.equal(ticketsOfOrder[0].order.orderNumber, 'tickets-magic-key');

      const buyer = await userFetch({
        query: /* GraphQL */ `
          query BuyerTicketOrders($orderId: ID!) {
            order(orderId: $orderId) {
              items {
                tokens {
                  order {
                    _id
                  }
                }
              }
            }
          }
        `,
        variables: { orderId },
      });
      assert.ifError(buyer.errors?.[0]);
      assert.deepEqual(
        buyer.data.order.items.flatMap(({ tokens }) => tokens.map(({ order }) => order?._id)),
        [orderId],
      );

      // Gate staff see the event's tickets but not the orders behind them
      const gate = await createLoggedInGraphqlFetch(GATE_TOKEN)({
        query: EVENT_TICKET_ORDERS,
        variables: { productId: TheaterEventId },
      });
      assert.ifError(gate.errors?.[0]);
      assert.ok(gate.data.product.tokens.length > 0);
      assert.ok(gate.data.product.tokens.every(({ order }) => order === null));
    });

    test('carts have no magic key', async () => {
      const cartId = await createCart('tickets-cart-without-key');
      const { data, errors } = await userFetch({
        query: ORDER_MAGIC_KEY,
        variables: { orderId: cartId },
      });
      assert.ifError(errors?.[0]);
      assert.equal(data.order.magicKey, null);
      assert.equal(data.order.ticketsPdfUrl, null);
    });
  });
});
