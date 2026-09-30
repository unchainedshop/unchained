import { createHash } from 'node:crypto';
import { SimplePaymentProvider } from './payments.js';
import { VirtualWarehousingProvider } from './warehousings.js';

// Ticketing fixtures for the tests/ticketing-*.test.ts files. The shared test platform registers
// createTicketingPlugin() and the ticket issuer (tests/setup.js); tickets are only issued where a
// test seeds the issuer's VIRTUAL provider with seedTicketing().

const sha256 = (text) => createHash('sha256').update(text).digest('hex');

export const GATE_TOKEN = 'Bearer gate-secret';
export const ORGANIZER_A_GATE_TOKEN = 'Bearer gate-organizer-a-secret';
export const ORGANIZER_A_MANAGER_TOKEN = 'Bearer event-manager-a-secret';

export const TicketIssuerProvider = {
  _id: 'ticket-issuer-provider',
  adapterKey: 'shop.unchained.warehousing.ticket',
  type: 'VIRTUAL',
  created: new Date('2026-01-01T00:00:00.000Z'),
  // Seeded providers do not get the adapter's initialConfiguration, so it is set explicitly
  configuration: [
    { key: 'entryOpensMinutesBefore', value: '120' },
    { key: 'entryClosesMinutesAfter', value: '60' },
    { key: 'serialOffset', value: '0' },
  ],
};

// Gate staff with the `ticketing` role: one for all events, one limited by the organizer scope
// of tests/setup.js to events tagged organizer-a
export const GateStaff = {
  _id: 'gate-staff',
  username: 'gate-staff',
  emails: [{ address: 'gate@unchained.local', verified: true }],
  guest: false,
  created: new Date(),
  updated: new Date(),
  roles: ['ticketing'],
  tags: [],
  services: { token: { secret: sha256('gate-secret') } },
};

export const OrganizerAGateStaff = {
  ...GateStaff,
  _id: 'gate-organizer-a',
  username: 'gate-organizer-a',
  emails: [{ address: 'gate-a@unchained.local', verified: true }],
  tags: ['organizer-a'],
  services: { token: { secret: sha256('gate-organizer-a-secret') } },
};

// Only granted cancelTicket (eventManager role of tests/setup.js), limited to organizer-a events
export const OrganizerAEventManager = {
  ...GateStaff,
  _id: 'event-manager-a',
  username: 'event-manager-a',
  emails: [{ address: 'manager-a@unchained.local', verified: true }],
  roles: ['eventManager'],
  tags: ['organizer-a'],
  services: { token: { secret: sha256('event-manager-a-secret') } },
};

// Manages products (productionManager role of tests/setup.js), limited to organizer-b events
export const PRODUCER_B_TOKEN = 'Bearer producer-b-secret';
export const OrganizerBProducer = {
  ...GateStaff,
  _id: 'producer-b',
  username: 'producer-b',
  emails: [{ address: 'producer-b@unchained.local', verified: true }],
  roles: ['productionManager'],
  tags: ['organizer-b'],
  services: { token: { secret: sha256('producer-b-secret') } },
};

const MINUTE = 60 * 1000;

const ticketEvent = ({ _id, tags, supply, slot }) => ({
  _id,
  type: 'TOKENIZED_PRODUCT',
  status: 'ACTIVE',
  created: new Date(),
  published: new Date(),
  sequence: 100,
  slugs: [_id],
  tags,
  commerce: {
    pricing: [
      {
        amount: 5000,
        minQuantity: 0,
        isTaxable: false,
        isNetPrice: false,
        currencyCode: 'CHF',
        countryCode: 'CH',
      },
    ],
  },
  // Off-chain tickets: no contract address or token id
  tokenization: {
    contractStandard: 'ERC721',
    supply,
  },
  meta: { slot, location: 'Stadttheater', category: 'concert' },
});

export const ConcertEventId = 'ticket-event-concert';
export const TheaterEventId = 'ticket-event-theater';

/**
 * Seeds the ticket issuer as the only VIRTUAL provider (the ETH minter provider of the default
 * seeds would issue every ticket a second time), the gate staff and two ticket events: a concert
 * of organizer-a starting in 30 minutes (start stored as a BSON Date, as bulk import does) and a
 * theater play of organizer-b starting in an hour (start stored as ISO string, as GraphQL JSON does).
 */
export default async function seedTicketing(db) {
  const now = Date.now();
  await db
    .collection('warehousing-providers')
    .updateOne({ _id: VirtualWarehousingProvider._id }, { $set: { deleted: new Date() } });
  await db.collection('warehousing-providers').insertOne({ ...TicketIssuerProvider });
  await db
    .collection('users')
    .insertMany([
      { ...GateStaff },
      { ...OrganizerAGateStaff },
      { ...OrganizerAEventManager },
      { ...OrganizerBProducer },
    ]);
  await db.collection('products').insertMany([
    ticketEvent({
      _id: ConcertEventId,
      tags: ['organizer-a'],
      supply: 5,
      slot: new Date(now + 30 * MINUTE),
    }),
    ticketEvent({
      _id: TheaterEventId,
      tags: ['organizer-b'],
      supply: 20,
      slot: new Date(now + 60 * MINUTE).toISOString(),
    }),
  ]);
  await db.collection('product_texts').insertMany([
    { _id: `${ConcertEventId}-de`, productId: ConcertEventId, locale: 'de', title: 'Konzert' },
    { _id: `${TheaterEventId}-de`, productId: TheaterEventId, locale: 'de', title: 'Theater' },
  ]);
}

const ORDER_TICKETS = /* GraphQL */ `
  query OrderTickets($orderId: ID!) {
    order(orderId: $orderId) {
      _id
      orderNumber
      status
      items {
        _id
        product {
          _id
        }
        tokens {
          _id
          tokenSerialNumber
          quantity
          ticketStatus
          attendeeName
          accessKey
          user {
            _id
          }
          product {
            _id
          }
        }
      }
    }
  }
`;

/**
 * Buys tickets through the storefront API: a new cart with the given positions, attendee names in
 * the cart meta (read by the ticketMeta hook of tests/setup.js), checkout with the seeded invoice
 * provider. Returns the confirmed order and its tickets.
 */
export async function buyTickets(graphqlFetch, { positions, attendees, orderNumber }) {
  const { data: cartData, errors: cartErrors } = await graphqlFetch({
    query: /* GraphQL */ `
      mutation CreateTicketCart($orderNumber: String!) {
        createCart(orderNumber: $orderNumber) {
          _id
        }
      }
    `,
    variables: { orderNumber },
  });
  if (cartErrors) throw new Error(JSON.stringify(cartErrors));
  const orderId = cartData.createCart._id;

  for (const { productId, quantity } of positions) {
    const { errors } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation AddTickets($orderId: ID, $productId: ID!, $quantity: Int) {
          addCartProduct(orderId: $orderId, productId: $productId, quantity: $quantity) {
            _id
          }
        }
      `,
      variables: { orderId, productId, quantity },
    });
    if (errors) throw new Error(JSON.stringify(errors));
  }

  const { errors: updateErrors } = await graphqlFetch({
    query: /* GraphQL */ `
      mutation PrepareTicketCart($orderId: ID, $meta: JSON, $paymentProviderId: ID) {
        updateCart(
          orderId: $orderId
          meta: $meta
          paymentProviderId: $paymentProviderId
          contact: { emailAddress: "buyer@unchained.local" }
          billingAddress: {
            firstName: "Ada"
            lastName: "Lovelace"
            addressLine: "Bahnhofstrasse 1"
            postalCode: "8001"
            city: "Zurich"
            countryCode: "CH"
          }
        ) {
          _id
        }
      }
    `,
    // Pinned: the seeded user prefers a crypto payment credential, which leaves orders PENDING
    variables: {
      orderId,
      meta: attendees ? { attendees } : undefined,
      paymentProviderId: SimplePaymentProvider._id,
    },
  });
  if (updateErrors) throw new Error(JSON.stringify(updateErrors));

  const { data: checkoutData, errors: checkoutErrors } = await graphqlFetch({
    query: /* GraphQL */ `
      mutation CheckoutTickets($orderId: ID) {
        checkoutCart(orderId: $orderId) {
          _id
          status
        }
      }
    `,
    variables: { orderId },
  });
  if (checkoutErrors) throw new Error(JSON.stringify(checkoutErrors));
  if (checkoutData.checkoutCart.status !== 'CONFIRMED') {
    throw new Error(`Ticket order ${orderId} is ${checkoutData.checkoutCart.status}`);
  }

  const { data, errors } = await graphqlFetch({ query: ORDER_TICKETS, variables: { orderId } });
  if (errors) throw new Error(JSON.stringify(errors));
  return { order: data.order, tickets: data.order.items.flatMap((item) => item.tokens) };
}

// Event history is written asynchronously after emit, so wait for the expected events.
export async function waitForEvents(db, filter, count = 1) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const events = await db.collection('events').find(filter).sort({ created: 1 }).toArray();
    if (events.length >= count) return events;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return db.collection('events').find(filter).sort({ created: 1 }).toArray();
}
