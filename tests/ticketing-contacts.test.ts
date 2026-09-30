import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import seedTicketing, { ConcertEventId, GATE_TOKEN, buyTickets } from './seeds/ticketing.js';

const DAY = 24 * 60 * 60 * 1000;

const CONTACT_OF_TICKET = /* GraphQL */ `
  query ContactOfTicket($code: String!, $productId: ID) {
    ticketLookup(code: $code, productId: $productId) {
      _id
      user {
        _id
        primaryEmail {
          address
        }
        lastContact {
          emailAddress
          telNumber
        }
      }
    }
  }
`;

const errorPaths = (errors) => (errors || []).map(({ path }) => path?.slice(-1)[0]);

test.describe('Ticketing: contact of ticket holders at the gate', () => {
  let adminFetch;
  let gateFetch;
  let ticket;

  test.before(async () => {
    const [db] = await setupDatabase();
    await seedTicketing(db);
    adminFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    gateFetch = createLoggedInGraphqlFetch(GATE_TOKEN);
    ({
      tickets: [ticket],
    } = await buyTickets(createLoggedInGraphqlFetch(USER_TOKEN), {
      orderNumber: 'contact-order',
      positions: [{ productId: ConcertEventId, quantity: 1 }],
      attendees: ['Ada Lovelace'],
    }));
  });

  test('gate staff may see the buyer e-mail and phone (viewUserContactInfos)', async () => {
    const { data, errors } = await gateFetch({
      query: `{ me { allowedActions } }`,
    });
    assert.ifError(errors?.[0]);
    assert.ok(data.me.allowedActions.includes('viewUserContactInfos'));
  });

  test('gate staff see e-mail and phone of holders of tickets of the gate period', async () => {
    const { data, errors } = await gateFetch({
      query: CONTACT_OF_TICKET,
      variables: { code: ticket._id, productId: ConcertEventId },
    });
    assert.ifError(errors?.[0]);
    const [{ user }] = data.ticketLookup;
    assert.ok(user.primaryEmail?.address);
    assert.equal(user.lastContact.emailAddress, 'buyer@unchained.local');
  });

  test('other private user data stays hidden from gate staff', async () => {
    const { errors } = await gateFetch({
      query: /* GraphQL */ `
        query Private($code: String!) {
          ticketLookup(code: $code) {
            _id
            user {
              _id
              emails {
                address
              }
              lastBillingAddress {
                addressLine
              }
            }
          }
        }
      `,
      variables: { code: ticket._id },
    });
    assert.deepEqual(errorPaths(errors).toSorted(), ['emails', 'lastBillingAddress']);
    for (const error of errors) assert.equal(error.extensions?.code, 'NoPermissionError');
  });

  test('outside the gate period the contact is hidden again', async () => {
    const move = (startsAt: Date) =>
      adminFetch({
        query: /* GraphQL */ `
          mutation Move($productId: ID!, $startsAt: DateTimeISO) {
            updateTicketEvent(productId: $productId, event: { startsAt: $startsAt }) {
              _id
            }
          }
        `,
        variables: { productId: ConcertEventId, startsAt: startsAt.toISOString() },
      });
    await move(new Date(Date.now() + 3 * DAY));
    try {
      const { errors } = await gateFetch({
        query: CONTACT_OF_TICKET,
        variables: { code: ticket._id, productId: ConcertEventId },
      });
      assert.deepEqual(errorPaths(errors).toSorted(), ['lastContact', 'primaryEmail']);
    } finally {
      await move(new Date(Date.now() + 30 * 60 * 1000));
    }
  });
});
