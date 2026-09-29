import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildTicketScanPayload } from '@unchainedshop/ticketing';
import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import seedTicketing, {
  ConcertEventId,
  GATE_TOKEN,
  GateStaff,
  ORGANIZER_A_GATE_TOKEN,
  ORGANIZER_A_MANAGER_TOKEN,
  TheaterEventId,
  buyTickets,
  waitForEvents,
} from './seeds/ticketing.js';

const MINUTE = 60 * 1000;

const TICKET_FIELDS = /* GraphQL */ `
  fragment GateTicket on Token {
    _id
    tokenSerialNumber
    ticketStatus
    isCanceled
    cancelledDate
    invalidatedDate
    attendeeName
    user {
      _id
      name
    }
    product {
      _id
    }
  }
`;

const SCAN_TICKET = /* GraphQL */ `
  mutation ScanTicket($tokenId: ID!, $productId: ID, $accessKey: String) {
    scanTicket(tokenId: $tokenId, productId: $productId, accessKey: $accessKey) {
      ...GateTicket
    }
  }
  ${TICKET_FIELDS}
`;

const TICKET_LOOKUP = /* GraphQL */ `
  query TicketLookup($code: String!, $productId: ID) {
    ticketLookup(code: $code, productId: $productId) {
      ...GateTicket
    }
  }
  ${TICKET_FIELDS}
`;

const CANCEL_TICKET = /* GraphQL */ `
  mutation CancelTicket($tokenId: ID!) {
    cancelTicket(tokenId: $tokenId) {
      ...GateTicket
    }
  }
  ${TICKET_FIELDS}
`;

const UPDATE_TICKET_EVENT = /* GraphQL */ `
  mutation MoveEvent($productId: ID!, $startsAt: DateTimeISO) {
    updateTicketEvent(productId: $productId, event: { startsAt: $startsAt }) {
      _id
      ... on TokenizedProduct {
        eventStartsAt
        eventLocation
        eventCategory
      }
    }
  }
`;

const TICKET_EVENTS = /* GraphQL */ `
  query TicketEvents($slotFrom: DateTimeISO, $slotTo: DateTimeISO) {
    ticketEvents(slotFrom: $slotFrom, slotTo: $slotTo) {
      _id
      ... on TokenizedProduct {
        eventStartsAt
        eventLocation
        eventCategory
        isCanceled
      }
    }
    ticketEventsCount(slotFrom: $slotFrom, slotTo: $slotTo)
  }
`;

test.describe('Ticketing: gate control', () => {
  let db;
  let adminFetch;
  let userFetch;
  let gateFetch;
  let organizerAGateFetch;
  let concertOrder;
  let concertTickets;
  let theaterTickets;

  const concertTicketOf = (attendeeName: string) =>
    concertTickets.find((ticket) => ticket.attendeeName === attendeeName);

  const moveConcert = async (startsAt: Date) => {
    const { data, errors } = await adminFetch({
      query: UPDATE_TICKET_EVENT,
      variables: { productId: ConcertEventId, startsAt: startsAt.toISOString() },
    });
    assert.ifError(errors?.[0]);
    return data.updateTicketEvent;
  };

  test.before(async () => {
    [db] = await setupDatabase();
    await seedTicketing(db);
    adminFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    userFetch = createLoggedInGraphqlFetch(USER_TOKEN);
    gateFetch = createLoggedInGraphqlFetch(GATE_TOKEN);
    organizerAGateFetch = createLoggedInGraphqlFetch(ORGANIZER_A_GATE_TOKEN);

    ({ order: concertOrder, tickets: concertTickets } = await buyTickets(userFetch, {
      orderNumber: 'concert-order',
      positions: [{ productId: ConcertEventId, quantity: 3 }],
      attendees: ['Ada Lovelace', 'Alan Turing', 'Grace Hopper'],
    }));
    ({ tickets: theaterTickets } = await buyTickets(userFetch, {
      orderNumber: 'theater-order',
      positions: [{ productId: TheaterEventId, quantity: 1 }],
      attendees: ['Hedy Lamarr'],
    }));
  });

  test('gate staff see the events by start range, with the event facts', async () => {
    const now = Date.now();
    // The concert start is a BSON Date, the theater start an ISO string
    const soon = await gateFetch({
      query: TICKET_EVENTS,
      variables: {
        slotFrom: new Date(now).toISOString(),
        slotTo: new Date(now + 45 * MINUTE).toISOString(),
      },
    });
    assert.ifError(soon.errors?.[0]);
    assert.deepEqual(
      soon.data.ticketEvents.map(({ _id }) => _id),
      [ConcertEventId],
    );
    assert.equal(soon.data.ticketEventsCount, 1);
    assert.equal(soon.data.ticketEvents[0].eventLocation, 'Stadttheater');
    assert.equal(soon.data.ticketEvents[0].eventCategory, 'concert');
    assert.equal(soon.data.ticketEvents[0].isCanceled, false);

    const later = await gateFetch({
      query: TICKET_EVENTS,
      variables: {
        slotFrom: new Date(now + 45 * MINUTE).toISOString(),
        slotTo: new Date(now + 120 * MINUTE).toISOString(),
      },
    });
    assert.ifError(later.errors?.[0]);
    assert.deepEqual(
      later.data.ticketEvents.map(({ _id }) => _id),
      [TheaterEventId],
    );
  });

  test('customers cannot redeem tickets', async () => {
    const { errors } = await userFetch({
      query: SCAN_TICKET,
      variables: { tokenId: concertTickets[0]._id, productId: ConcertEventId },
    });
    assert.equal(errors?.[0]?.extensions?.code, 'NoPermissionError');
  });

  test('a QR code whose access key does not match the ticket is refused', async () => {
    const ticket = concertTicketOf('Ada Lovelace');
    const { errors } = await gateFetch({
      query: SCAN_TICKET,
      variables: { tokenId: ticket._id, productId: ConcertEventId, accessKey: 'issued-to-someone-else' },
    });
    assert.equal(errors?.[0]?.extensions?.code, 'TicketAccessKeyInvalidError');
    const [unchanged] = await (async () => {
      const { data } = await gateFetch({
        query: TICKET_LOOKUP,
        variables: { code: ticket._id, productId: ConcertEventId },
      });
      return data.ticketLookup;
    })();
    assert.equal(unchanged.ticketStatus, 'VALID');
  });

  test('a valid ticket is redeemed once and TICKET_REDEEMED names the gate user', async () => {
    const ticket = concertTicketOf('Ada Lovelace');
    const redeemed = await gateFetch({
      query: SCAN_TICKET,
      variables: { tokenId: ticket._id, productId: ConcertEventId, accessKey: ticket.accessKey },
    });
    assert.ifError(redeemed.errors?.[0]);
    assert.equal(redeemed.data.scanTicket.ticketStatus, 'REDEEMED');
    assert.equal(redeemed.data.scanTicket.attendeeName, 'Ada Lovelace');
    assert.ok(redeemed.data.scanTicket.invalidatedDate);

    const [event] = await waitForEvents(db, { type: 'TICKET_REDEEMED' });
    assert.equal(event?.payload?.token?._id, ticket._id);
    assert.equal(event?.payload?.redeemedBy, GateStaff._id);

    const again = await gateFetch({
      query: SCAN_TICKET,
      variables: { tokenId: ticket._id, productId: ConcertEventId },
    });
    assert.equal(again.errors?.[0]?.extensions?.code, 'TicketAlreadyRedeemedError');
    assert.equal(
      new Date(again.errors?.[0]?.extensions?.invalidatedDate).getTime(),
      new Date(redeemed.data.scanTicket.invalidatedDate).getTime(),
    );
  });

  test('a ticket of another event is refused', async () => {
    const { errors } = await gateFetch({
      query: SCAN_TICKET,
      variables: { tokenId: theaterTickets[0]._id, productId: ConcertEventId },
    });
    assert.equal(errors?.[0]?.extensions?.code, 'TicketWrongEventError');
    assert.equal(errors?.[0]?.extensions?.productId, TheaterEventId);
    assert.equal(errors?.[0]?.extensions?.expectedProductId, ConcertEventId);
  });

  test('a cancelled ticket is CANCELLED, not REDEEMED, and refused as cancelled', async () => {
    const ticket = concertTicketOf('Alan Turing');
    const cancelled = await adminFetch({ query: CANCEL_TICKET, variables: { tokenId: ticket._id } });
    assert.ifError(cancelled.errors?.[0]);
    assert.equal(cancelled.data.cancelTicket.ticketStatus, 'CANCELLED');
    assert.equal(cancelled.data.cancelTicket.isCanceled, true);
    assert.ok(cancelled.data.cancelTicket.cancelledDate);
    // Cancelling also invalidates the ticket
    assert.ok(cancelled.data.cancelTicket.invalidatedDate);

    const [event] = await waitForEvents(db, { type: 'TICKET_CANCELLED' });
    assert.equal(event?.payload?.token?._id, ticket._id);

    const { errors } = await gateFetch({
      query: SCAN_TICKET,
      variables: { tokenId: ticket._id, productId: ConcertEventId },
    });
    assert.equal(errors?.[0]?.extensions?.code, 'TicketCanceledError');
    assert.equal(errors?.[0]?.extensions?.scope, 'TICKET');
  });

  test('tickets are refused outside the entry window of the ticket issuer', async () => {
    const ticket = concertTicketOf('Grace Hopper');
    try {
      const startsAt = new Date(Date.now() + 24 * 60 * MINUTE);
      const moved = await moveConcert(startsAt);
      assert.equal(new Date(moved.eventStartsAt).getTime(), startsAt.getTime());
      assert.equal(moved.eventLocation, 'Stadttheater');

      const early = await gateFetch({
        query: SCAN_TICKET,
        variables: { tokenId: ticket._id, productId: ConcertEventId },
      });
      assert.equal(early.errors?.[0]?.extensions?.code, 'TicketNotRedeemableError');
      assert.equal(early.errors?.[0]?.extensions?.reason, 'NOT_YET_OPEN');
      // entryOpensMinutesBefore 120, entryClosesMinutesAfter 60
      assert.equal(
        new Date(early.errors?.[0]?.extensions?.opensAt).getTime(),
        startsAt.getTime() - 120 * MINUTE,
      );
      assert.equal(
        new Date(early.errors?.[0]?.extensions?.closesAt).getTime(),
        startsAt.getTime() + 60 * MINUTE,
      );

      await moveConcert(new Date(Date.now() - 24 * 60 * MINUTE));
      const late = await gateFetch({
        query: SCAN_TICKET,
        variables: { tokenId: ticket._id, productId: ConcertEventId },
      });
      assert.equal(late.errors?.[0]?.extensions?.code, 'TicketNotRedeemableError');
      assert.equal(late.errors?.[0]?.extensions?.reason, 'ENTRY_CLOSED');

      const stored = await db.collection('token_surrogates').findOne({ _id: ticket._id });
      assert.equal(stored.invalidatedDate, undefined);
    } finally {
      await moveConcert(new Date(Date.now() + 30 * MINUTE));
    }
  });

  test.describe('ticketLookup', () => {
    const lookup = async (code: string, productId?: string, graphqlFetch = gateFetch) => {
      const { data, errors } = await graphqlFetch({
        query: TICKET_LOOKUP,
        variables: { code, productId },
      });
      assert.ifError(errors?.[0]);
      return data.ticketLookup;
    };

    test('by token id and by the canonical QR payload', async () => {
      const [ticket] = concertTickets;
      assert.deepEqual(
        (await lookup(ticket._id)).map(({ _id }) => _id),
        [ticket._id],
      );
      const payload = buildTicketScanPayload(
        { tokenId: ticket._id, accessKey: ticket.accessKey },
        { baseUrl: 'https://shop.example.com/tickets' },
      );
      assert.deepEqual(
        (await lookup(payload, ConcertEventId)).map(({ _id }) => _id),
        [ticket._id],
      );
    });

    test('by serial within the event', async () => {
      // Serials restart per event, the event decides which ticket #1 is meant
      const concertFirst = concertTickets.find(({ tokenSerialNumber }) => tokenSerialNumber === '1');
      const [theaterFirst] = theaterTickets;
      assert.equal(theaterFirst.tokenSerialNumber, '1');
      assert.deepEqual(
        (await lookup('#1', ConcertEventId)).map(({ _id }) => _id),
        [concertFirst._id],
      );
      assert.deepEqual(
        (await lookup('1', TheaterEventId)).map(({ _id }) => _id),
        [theaterFirst._id],
      );
    });

    test('by order number', async () => {
      const found = await lookup(concertOrder.orderNumber);
      assert.deepEqual(found.map(({ _id }) => _id).sort(), concertTickets.map(({ _id }) => _id).sort());
    });

    test('by attendee name within the event', async () => {
      const found = await lookup('hopper', ConcertEventId);
      assert.deepEqual(
        found.map(({ attendeeName }) => attendeeName),
        ['Grace Hopper'],
      );
      assert.deepEqual(await lookup('hopper', TheaterEventId), []);
      // Names are only searched within an event
      assert.deepEqual(await lookup('hopper'), []);
    });
  });

  test('gate staff see the attendee name and only the public profile of the buyer', async () => {
    const [ticket] = concertTickets;
    const visible = await gateFetch({ query: TICKET_LOOKUP, variables: { code: ticket._id } });
    assert.ifError(visible.errors?.[0]);
    assert.equal(visible.data.ticketLookup[0].attendeeName, ticket.attendeeName);
    assert.equal(visible.data.ticketLookup[0].user._id, 'user');

    const privateFields = await gateFetch({
      query: /* GraphQL */ `
        query PrivateBuyerData($code: String!) {
          ticketLookup(code: $code) {
            _id
            user {
              _id
              username
              primaryEmail {
                address
              }
            }
          }
        }
      `,
      variables: { code: ticket._id },
    });
    assert.ok(privateFields.errors?.length);
    assert.ok(privateFields.errors.every(({ extensions }) => extensions?.code === 'NoPermissionError'));

    // The event's ticket list is open to gate staff as well
    const eventTickets = await gateFetch({
      query: /* GraphQL */ `
        query EventTickets($productId: ID!) {
          product(productId: $productId) {
            ... on TokenizedProduct {
              tokens {
                _id
                attendeeName
              }
            }
          }
        }
      `,
      variables: { productId: ConcertEventId },
    });
    assert.ifError(eventTickets.errors?.[0]);
    assert.deepEqual(eventTickets.data.product.tokens.map(({ attendeeName }) => attendeeName).sort(), [
      'Ada Lovelace',
      'Alan Turing',
      'Grace Hopper',
    ]);
  });

  test.describe('organizer scope', () => {
    test('narrows the event lists of scoped gate staff', async () => {
      const scoped = await organizerAGateFetch({ query: TICKET_EVENTS });
      assert.ifError(scoped.errors?.[0]);
      assert.deepEqual(
        scoped.data.ticketEvents.map(({ _id }) => _id),
        [ConcertEventId],
      );
      assert.equal(scoped.data.ticketEventsCount, 1);

      const unscoped = await gateFetch({ query: TICKET_EVENTS });
      assert.ifError(unscoped.errors?.[0]);
      assert.deepEqual(unscoped.data.ticketEvents.map(({ _id }) => _id).sort(), [
        ConcertEventId,
        TheaterEventId,
      ]);
    });

    test('hides the tickets of other organizers from lookup, lists and scanning', async () => {
      const [theaterTicket] = theaterTickets;
      const lookup = await organizerAGateFetch({
        query: TICKET_LOOKUP,
        variables: { code: theaterTicket._id },
      });
      assert.ifError(lookup.errors?.[0]);
      assert.deepEqual(lookup.data.ticketLookup, []);

      const ownLookup = await organizerAGateFetch({
        query: TICKET_LOOKUP,
        variables: { code: concertTickets[0]._id },
      });
      assert.equal(ownLookup.data.ticketLookup.length, 1);

      const tokens = await organizerAGateFetch({
        query: /* GraphQL */ `
          query EventTickets($productId: ID!) {
            product(productId: $productId) {
              ... on TokenizedProduct {
                tokens {
                  _id
                }
              }
            }
          }
        `,
        variables: { productId: TheaterEventId },
      });
      assert.equal(tokens.errors?.[0]?.extensions?.code, 'NoPermissionError');

      const scan = await organizerAGateFetch({
        query: SCAN_TICKET,
        variables: { tokenId: theaterTicket._id, productId: TheaterEventId },
      });
      assert.equal(scan.errors?.[0]?.extensions?.code, 'NoPermissionError');
    });

    test('limits a role granted cancelTicket to its events', async () => {
      const managerFetch = createLoggedInGraphqlFetch(ORGANIZER_A_MANAGER_TOKEN);
      const [theaterTicket] = theaterTickets;
      const foreignTicket = await managerFetch({
        query: /* GraphQL */ `
          mutation CancelTicket($tokenId: ID!) {
            cancelTicket(tokenId: $tokenId) {
              _id
            }
          }
        `,
        variables: { tokenId: theaterTicket._id },
      });
      assert.equal(foreignTicket.errors?.[0]?.extensions?.code, 'NoPermissionError');

      const foreignEvent = await managerFetch({
        query: /* GraphQL */ `
          mutation CancelEvent($productId: ID!) {
            cancelEvent(productId: $productId)
          }
        `,
        variables: { productId: TheaterEventId },
      });
      assert.equal(foreignEvent.errors?.[0]?.extensions?.code, 'NoPermissionError');

      const stored = await db.collection('token_surrogates').findOne({ _id: theaterTicket._id });
      assert.equal(stored.meta.cancelled, undefined);
    });
  });

  test('cancelEvent cancels all remaining tickets, redeemed ones keep their redemption date', async () => {
    const redeemed = concertTicketOf('Ada Lovelace');
    const valid = concertTicketOf('Grace Hopper');
    const before = await db.collection('token_surrogates').findOne({ _id: redeemed._id });

    const { data, errors } = await adminFetch({
      query: /* GraphQL */ `
        mutation CancelEvent($productId: ID!) {
          cancelEvent(productId: $productId)
        }
      `,
      variables: { productId: ConcertEventId },
    });
    assert.ifError(errors?.[0]);
    // The ticket cancelled before is not cancelled again
    assert.equal(data.cancelEvent, 2);

    const [eventCancelled] = await waitForEvents(db, { type: 'TICKET_EVENT_CANCELLED' });
    assert.deepEqual(eventCancelled?.payload, { productId: ConcertEventId, cancelledCount: 2 });
    const ticketCancelled = await waitForEvents(db, { type: 'TICKET_CANCELLED' }, 3);
    assert.deepEqual(
      ticketCancelled
        .slice(1)
        .map(({ payload }) => payload.token._id)
        .sort(),
      [redeemed._id, valid._id].sort(),
    );

    const tickets = await adminFetch({
      query: /* GraphQL */ `
        query EventTickets($productId: ID!) {
          product(productId: $productId) {
            ... on TokenizedProduct {
              isCanceled
              tokens {
                _id
                ticketStatus
                invalidatedDate
                cancelledDate
              }
            }
          }
        }
      `,
      variables: { productId: ConcertEventId },
    });
    assert.ifError(tickets.errors?.[0]);
    assert.equal(tickets.data.product.isCanceled, true);
    assert.ok(tickets.data.product.tokens.every(({ ticketStatus }) => ticketStatus === 'CANCELLED'));
    const redeemedAfter = tickets.data.product.tokens.find(({ _id }) => _id === redeemed._id);
    assert.equal(new Date(redeemedAfter.invalidatedDate).getTime(), before.invalidatedDate.getTime());
    assert.ok(new Date(redeemedAfter.cancelledDate) >= before.invalidatedDate);

    const scan = await gateFetch({
      query: SCAN_TICKET,
      variables: { tokenId: valid._id, productId: ConcertEventId },
    });
    assert.equal(scan.errors?.[0]?.extensions?.code, 'TicketCanceledError');

    // Cancelled events are no longer sold
    const { errors: cartErrors } = await userFetch({
      query: /* GraphQL */ `
        mutation AddTickets($productId: ID!) {
          addCartProduct(productId: $productId, quantity: 1) {
            _id
          }
        }
      `,
      variables: { productId: ConcertEventId },
    });
    assert.equal(cartErrors?.[0]?.extensions?.code, 'TicketEventCancelledError');
  });
});
