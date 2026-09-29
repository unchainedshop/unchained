import test from 'node:test';
import assert from 'node:assert';

// Runs against the example started by `test:integration:start` (see package.json), which seeds the
// demo event, the ticket issuer provider and the gate user (seed.ts).
const baseUrl = process.env.ROOT_URL || 'http://localhost:4010';
const password = process.env.UNCHAINED_SEED_PASSWORD || 'password';

const cookieOf = (response) =>
  response.headers
    .getSetCookie()
    .map((setCookie) => setCookie.split(';')[0])
    .join('; ');

const graphql = async (query, variables = {}, { cookie, headers = {} } = {}) => {
  const response = await fetch(`${baseUrl}/graphql`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(cookie && { cookie }), ...headers },
    body: JSON.stringify({ query, variables }),
  });
  return { ...(await response.json()), cookie: cookieOf(response) };
};

const login = async (email) => {
  const { data, errors, cookie } = await graphql(
    /* GraphQL */ `
      mutation Login($email: String!, $password: String!) {
        loginWithPassword(email: $email, password: $password) {
          _id
        }
      }
    `,
    { email, password },
  );
  assert.ifError(errors?.[0]);
  assert.ok(data.loginWithPassword._id);
  return cookie;
};

const TICKET_FIELDS = /* GraphQL */ `
  fragment TicketFields on Token {
    _id
    tokenSerialNumber
    ticketStatus
    isCanceled
    attendeeName
    product {
      _id
    }
  }
`;

let adminCookie;
let gateCookie;
let buyerCookie;
let event;
let order;
let tickets;

test.before(async () => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      await fetch(`${baseUrl}/graphql`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: '{ shopInfo { _id } }' }),
      });
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  adminCookie = await login('admin@unchained.local');
  gateCookie = await login('gate@unchained.local');
});

test.describe('Ticketing example', () => {
  test('an event manager moves the seeded event to start in half an hour', async () => {
    // The seed runs once per database, so the event may lie in the past on later runs.
    const { data, errors } = await graphql(
      /* GraphQL */ `
        query ExampleEvent {
          ticketEvents(tags: ["example-event"]) {
            _id
          }
        }
      `,
      {},
      { cookie: adminCookie },
    );
    assert.ifError(errors?.[0]);
    assert.strictEqual(data.ticketEvents.length, 1);

    const startsAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const updated = await graphql(
      /* GraphQL */ `
        mutation MoveEvent($productId: ID!, $startsAt: DateTimeISO) {
          updateTicketEvent(productId: $productId, event: { startsAt: $startsAt }) {
            _id
            ... on TokenizedProduct {
              eventStartsAt
              eventDoorsOpenAt
            }
          }
        }
      `,
      { productId: data.ticketEvents[0]._id, startsAt },
      { cookie: adminCookie },
    );
    assert.ifError(updated.errors?.[0]);
    assert.strictEqual(new Date(updated.data.updateTicketEvent.eventStartsAt).toISOString(), startsAt);
    // doorsOpenMinutesBefore (30) is kept when only the start changes
    assert.ok(updated.data.updateTicketEvent.eventDoorsOpenAt);
  });

  test('gate staff see the seeded event among the events of today', async () => {
    const now = Date.now();
    const { data, errors } = await graphql(
      /* GraphQL */ `
        query GateEvents($slotFrom: DateTimeISO, $slotTo: DateTimeISO) {
          ticketEvents(slotFrom: $slotFrom, slotTo: $slotTo, onlyInvalidateable: false) {
            _id
            tags
            ... on TokenizedProduct {
              eventStartsAt
              eventLocation
              eventCategory
            }
          }
        }
      `,
      {
        slotFrom: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
        slotTo: new Date(now + 12 * 60 * 60 * 1000).toISOString(),
      },
      { cookie: gateCookie },
    );
    assert.ifError(errors?.[0]);
    event = data.ticketEvents.find(({ tags }) => tags.includes('example-event'));
    assert.ok(event, 'the seeded event is listed');
    assert.strictEqual(event.eventCategory, 'Concert');
    assert.ok(event.eventLocation);
  });

  test('a guest buys two tickets and receives them with the attendee names', async () => {
    const guest = await graphql(/* GraphQL */ `
      mutation {
        loginAsGuest {
          _id
        }
      }
    `);
    assert.ifError(guest.errors?.[0]);
    buyerCookie = guest.cookie;

    const added = await graphql(
      /* GraphQL */ `
        mutation AddTickets($productId: ID!) {
          addCartProduct(
            productId: $productId
            quantity: 2
            configuration: [{ key: "attendees", value: "Ada Lovelace, Alan Turing" }]
          ) {
            _id
          }
          updateCart(
            contact: { emailAddress: "guest@unchained.local" }
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
      { productId: event._id },
      { cookie: buyerCookie },
    );
    assert.ifError(added.errors?.[0]);

    const checkout = await graphql(
      /* GraphQL */ `
        mutation {
          checkoutCart {
            _id
            status
          }
        }
      `,
      {},
      { cookie: buyerCookie },
    );
    assert.ifError(checkout.errors?.[0]);
    assert.strictEqual(checkout.data.checkoutCart.status, 'CONFIRMED');

    const { data, errors } = await graphql(
      /* GraphQL */ `
        query OrderTickets($orderId: ID!) {
          order(orderId: $orderId) {
            _id
            magicKey
            ticketsPdfUrl
            items {
              tokens {
                ...TicketFields
                accessKey
              }
            }
          }
        }
        ${TICKET_FIELDS}
      `,
      { orderId: checkout.data.checkoutCart._id },
      { cookie: buyerCookie },
    );
    assert.ifError(errors?.[0]);
    order = data.order;
    tickets = order.items.flatMap((item) => item.tokens);
    assert.strictEqual(tickets.length, 2);
    assert.deepStrictEqual(tickets.map(({ attendeeName }) => attendeeName).sort(), [
      'Ada Lovelace',
      'Alan Turing',
    ]);
    assert.ok(tickets.every(({ ticketStatus }) => ticketStatus === 'VALID'));
    assert.notStrictEqual(tickets[0].tokenSerialNumber, tickets[1].tokenSerialNumber);
    // The buyer gets the magic key; without a PDF renderer there is no tickets PDF link.
    assert.match(order.magicKey, /^[a-f\d]{64}$/);
    assert.strictEqual(order.ticketsPdfUrl, null);
  });

  test('the cart refuses more tickets than the event supply', async () => {
    const { errors } = await graphql(
      /* GraphQL */ `
        mutation TooManyTickets($productId: ID!) {
          addCartProduct(productId: $productId, quantity: 1000) {
            _id
          }
        }
      `,
      { productId: event._id },
      { cookie: buyerCookie },
    );
    assert.strictEqual(errors?.[0]?.extensions?.code, 'TicketSoldOutError');
  });

  test('the print link accepts the magic key as otp (404 without a PDF renderer)', async () => {
    const withoutKey = await fetch(`${baseUrl}/rest/print_tickets?orderId=${order._id}&otp=wrong`);
    assert.strictEqual(withoutKey.status, 403);

    const withKey = await fetch(
      `${baseUrl}/rest/print_tickets?orderId=${order._id}&otp=${order.magicKey}`,
    );
    assert.strictEqual(withKey.status, 404);
    assert.deepStrictEqual(await withKey.json(), { error: 'Ticket PDF not configured' });
  });

  test('the wallet routes check the ticket access key (404 without renderers)', async () => {
    const [ticket] = tickets;
    const wrongHash = await fetch(`${baseUrl}/rest/google-wallet/download/${ticket._id}?hash=wrong`);
    assert.strictEqual(wrongHash.status, 403);

    const google = await fetch(
      `${baseUrl}/rest/google-wallet/download/${ticket._id}?hash=${ticket.accessKey}`,
    );
    assert.strictEqual(google.status, 404);
    assert.deepStrictEqual(await google.json(), { error: 'Google Wallet not configured' });

    const apple = await fetch(
      `${baseUrl}/rest/apple-wallet/download/${ticket._id}.pkpass?hash=${ticket.accessKey}`,
    );
    assert.strictEqual(apple.status, 404);
    assert.deepStrictEqual(await apple.json(), { error: 'Apple Wallet not configured' });
  });

  test('customers cannot redeem tickets', async () => {
    const { errors } = await graphql(
      /* GraphQL */ `
        mutation Scan($tokenId: ID!, $productId: ID) {
          scanTicket(tokenId: $tokenId, productId: $productId) {
            _id
          }
        }
      `,
      { tokenId: tickets[0]._id, productId: event._id },
      { cookie: buyerCookie },
    );
    assert.strictEqual(errors?.[0]?.extensions?.code, 'NoPermissionError');
  });

  test('gate staff look a scanned QR code up and redeem the ticket once', async () => {
    const [ticket] = tickets;
    // The canonical QR payload (buildTicketScanPayload): <baseUrl>/<tokenId>?hash=<accessKey>
    const scannedCode = `https://shop.example.com/tickets/${ticket._id}?hash=${ticket.accessKey}`;
    const lookup = await graphql(
      /* GraphQL */ `
        query Lookup($code: String!, $productId: ID) {
          ticketLookup(code: $code, productId: $productId) {
            ...TicketFields
          }
        }
        ${TICKET_FIELDS}
      `,
      { code: scannedCode, productId: event._id },
      { cookie: gateCookie },
    );
    assert.ifError(lookup.errors?.[0]);
    assert.deepStrictEqual(
      lookup.data.ticketLookup.map(({ _id }) => _id),
      [ticket._id],
    );

    const scan = /* GraphQL */ `
      mutation Scan($tokenId: ID!, $productId: ID) {
        scanTicket(tokenId: $tokenId, productId: $productId) {
          ...TicketFields
        }
      }
      ${TICKET_FIELDS}
    `;
    const redeemed = await graphql(
      scan,
      { tokenId: ticket._id, productId: event._id },
      { cookie: gateCookie },
    );
    assert.ifError(redeemed.errors?.[0]);
    assert.strictEqual(redeemed.data.scanTicket.ticketStatus, 'REDEEMED');
    assert.strictEqual(redeemed.data.scanTicket.attendeeName, ticket.attendeeName);

    const again = await graphql(
      scan,
      { tokenId: ticket._id, productId: event._id },
      { cookie: gateCookie },
    );
    assert.strictEqual(again.errors?.[0]?.extensions?.code, 'TicketAlreadyRedeemedError');
  });

  test('a cancelled ticket is refused at the gate', async () => {
    const [, ticket] = tickets;
    const cancelled = await graphql(
      /* GraphQL */ `
        mutation Cancel($tokenId: ID!) {
          cancelTicket(tokenId: $tokenId) {
            ...TicketFields
          }
        }
        ${TICKET_FIELDS}
      `,
      { tokenId: ticket._id },
      { cookie: adminCookie },
    );
    assert.ifError(cancelled.errors?.[0]);
    assert.strictEqual(cancelled.data.cancelTicket.ticketStatus, 'CANCELLED');
    assert.strictEqual(cancelled.data.cancelTicket.isCanceled, true);

    const { errors } = await graphql(
      /* GraphQL */ `
        mutation Scan($tokenId: ID!, $productId: ID) {
          scanTicket(tokenId: $tokenId, productId: $productId) {
            _id
          }
        }
      `,
      { tokenId: ticket._id, productId: event._id },
      { cookie: gateCookie },
    );
    assert.strictEqual(errors?.[0]?.extensions?.code, 'TicketCanceledError');
    assert.strictEqual(errors?.[0]?.extensions?.scope, 'TICKET');
  });
});
