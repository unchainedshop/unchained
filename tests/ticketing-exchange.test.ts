import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import seedTicketing, { ORGANIZER_A_MANAGER_TOKEN, buyTickets } from './seeds/ticketing.js';

const DAY = 24 * 60 * 60 * 1000;

const EXCHANGE = /* GraphQL */ `
  mutation Exchange($tokenIds: [ID!]!, $productId: ID!) {
    exchangeTickets(tokenIds: $tokenIds, productId: $productId) {
      _id
      ticketStatus
      attendeeName
      user {
        _id
      }
      product {
        _id
      }
    }
  }
`;

test.describe('Ticketing: exchanging tickets between dates', () => {
  let db;
  let adminFetch;
  let userFetch;
  let dateA: string;
  let dateB: string;
  let moved: { _id: string }[];
  let order;

  const availableOf = async (productId: string) => {
    const { data, errors } = await adminFetch({
      query: /* GraphQL */ `
        query Available($productId: ID!) {
          product(productId: $productId) {
            ... on TokenizedProduct {
              event {
                available
              }
            }
          }
        }
      `,
      variables: { productId },
    });
    assert.ifError(errors?.[0]);
    return data.product.event.available;
  };

  const statusOf = async (tokenId: string) => {
    const { data } = await adminFetch({
      query: `query T($tokenId: ID!) { token(tokenId: $tokenId) { ticketStatus } }`,
      variables: { tokenId },
    });
    return data.token.ticketStatus;
  };

  test.before(async () => {
    [db] = await setupDatabase();
    await seedTicketing(db);
    adminFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    userFetch = createLoggedInGraphqlFetch(USER_TOKEN);

    const first = new Date(Date.now() + 10 * DAY);
    first.setUTCHours(10, 0, 0, 0);
    const second = new Date(first.getTime() + 7 * DAY);
    const { data, errors } = await adminFetch({
      query: /* GraphQL */ `
        mutation Create($production: CreateTicketProductionInput!) {
          createTicketProduction(production: $production) {
            _id
            ... on ConfigurableProduct {
              assignments(includeInactive: true) {
                product {
                  _id
                  ... on TokenizedProduct {
                    event {
                      startsAt
                    }
                  }
                }
              }
            }
          }
        }
      `,
      variables: {
        production: {
          texts: [{ locale: 'de', title: 'Kochkurs', slug: 'kochkurs' }],
          tags: ['organizer-b'],
          categories: [
            {
              code: 'kids',
              capacity: 3,
              pricing: [{ amount: 3000, currencyCode: 'CHF', countryCode: 'CH' }],
            },
          ],
          performances: [{ startsAt: first.toISOString() }, { startsAt: second.toISOString() }],
        },
      },
    });
    assert.ifError(errors?.[0]);
    const production = data.createTicketProduction;
    const productOf = (date: Date) =>
      production.assignments.find(
        ({ product }) => new Date(product.event.startsAt).getTime() === date.getTime(),
      ).product._id;
    dateA = productOf(first);
    dateB = productOf(second);
    const published = await adminFetch({
      query: `mutation P($productionId: ID!) { publishTicketProduction(productionId: $productionId) { _id } }`,
      variables: { productionId: production._id },
    });
    assert.ifError(published.errors?.[0]);
  });

  test('two seats move to another date and keep their purchase and attendees', async () => {
    ({ order } = await buyTickets(userFetch, {
      orderNumber: 'exchange-family',
      positions: [{ productId: dateA, quantity: 2 }],
      attendees: ['Mia', 'Leo'],
    }));
    const tickets = order.items[0].tokens;
    const { data, errors } = await adminFetch({
      query: EXCHANGE,
      variables: { tokenIds: tickets.map(({ _id }) => _id), productId: dateB },
    });
    assert.ifError(errors?.[0]);
    moved = data.exchangeTickets;
    assert.deepEqual(
      moved
        .map(({ attendeeName, ticketStatus, user, product }: any) => ({
          attendeeName,
          ticketStatus,
          userId: user._id,
          productId: product._id,
        }))
        .sort((a, b) => a.attendeeName.localeCompare(b.attendeeName)),
      [
        { attendeeName: 'Leo', ticketStatus: 'VALID', userId: 'user', productId: dateB },
        { attendeeName: 'Mia', ticketStatus: 'VALID', userId: 'user', productId: dateB },
      ],
    );
    for (const { _id } of tickets) assert.equal(await statusOf(_id), 'CANCELLED');
    assert.equal(await availableOf(dateA), 3, 'the seats on the old date are free again');
    assert.equal(await availableOf(dateB), 1);

    const { data: after } = await userFetch({
      query: `query O($orderId: ID!) { order(orderId: $orderId) { items { quantity product { _id } } } }`,
      variables: { orderId: order._id },
    });
    assert.deepEqual(after.order.items, [{ quantity: 2, product: { _id: dateA } }], 'the order stays');
  });

  test('a retry does not move the tickets twice', async () => {
    const { data, errors } = await adminFetch({
      query: EXCHANGE,
      variables: { tokenIds: order.items[0].tokens.map(({ _id }) => _id), productId: dateB },
    });
    assert.ifError(errors?.[0]);
    assert.deepEqual(
      data.exchangeTickets.map(({ _id }) => _id).sort(),
      moved.map(({ _id }) => _id).sort(),
    );
    assert.equal(await availableOf(dateB), 1);
  });

  test('nothing moves to a date without enough seats', async () => {
    await buyTickets(userFetch, {
      orderNumber: 'exchange-fills-b',
      positions: [{ productId: dateB, quantity: 1 }],
    });
    const { order: another } = await buyTickets(userFetch, {
      orderNumber: 'exchange-wants-b',
      positions: [{ productId: dateA, quantity: 1 }],
    });
    const [ticket] = another.items[0].tokens;
    const { errors } = await adminFetch({
      query: EXCHANGE,
      variables: { tokenIds: [ticket._id], productId: dateB },
    });
    assert.equal(errors?.[0]?.extensions?.code, 'TicketSoldOutError');
    assert.equal(await statusOf(ticket._id), 'VALID');
    assert.equal(await availableOf(dateA), 2);
    assert.equal(await availableOf(dateB), 0);
  });

  test('an organizer cannot exchange tickets of another organizer', async () => {
    const { errors } = await createLoggedInGraphqlFetch(ORGANIZER_A_MANAGER_TOKEN)({
      query: EXCHANGE,
      variables: { tokenIds: moved.map(({ _id }) => _id), productId: dateA },
    });
    assert.equal(errors?.[0]?.extensions?.code, 'NoPermissionError');
    assert.equal(await statusOf(moved[0]._id), 'VALID');
  });

  test('a retry creates the replacement a failed run left out', async () => {
    // As if the run had stopped between cancelling the ticket and creating its replacement
    await db
      .collection('token_surrogates')
      .updateOne(
        { _id: moved[0]._id },
        { $set: { 'meta.cancelled': true, 'meta.exchangedTo': 'recovered-ticket' } },
      );
    const { data, errors } = await adminFetch({
      query: EXCHANGE,
      variables: { tokenIds: [moved[0]._id], productId: dateA },
    });
    assert.ifError(errors?.[0]);
    assert.deepEqual(
      data.exchangeTickets.map(({ _id, product }) => [_id, product._id]),
      [['recovered-ticket', dateA]],
    );
  });
});
