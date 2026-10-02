import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { ADMIN_TOKEN } from './seeds/users.js';
import seedTicketing, { ConcertEventId, PRODUCER_B_TOKEN } from './seeds/ticketing.js';

const DAY = 24 * 60 * 60 * 1000;

const PRODUCTION_FIELDS = /* GraphQL */ `
  fragment ProductionFields on Product {
    _id
    status
    tags
    ... on ConfigurableProduct {
      ticketProduction {
        location
        durationMinutes
        doorsOpenMinutesBefore
        saleRules {
          salesStart
          maxPerOrder
        }
        categories {
          code
          capacity
          pricing {
            amount
            currencyCode
          }
          option {
            value
            texts(forceLocale: "de") {
              title
            }
          }
        }
      }
      assignments(includeInactive: true) {
        vectors {
          variation {
            key
          }
          option {
            value
          }
        }
        product {
          _id
          ... on TokenizedProduct {
            contractConfiguration {
              supply
            }
            event {
              startsAt
              location
              category
              categoryTitle(forceLocale: "de")
              overridden
              saleRules {
                salesStart
                maxPerOrder
              }
            }
          }
        }
      }
    }
  }
`;

const CREATE_PRODUCTION = /* GraphQL */ `
  mutation CreateProduction($production: CreateTicketProductionInput!) {
    createTicketProduction(production: $production) {
      ...ProductionFields
    }
  }
  ${PRODUCTION_FIELDS}
`;

const vectorOf = (assignment) =>
  Object.fromEntries(assignment.vectors.map(({ variation, option }) => [variation.key, option.value]));

test.describe('Ticketing: productions', () => {
  let adminFetch;
  let producerFetch;
  const first = new Date(Date.now() + 10 * DAY);
  first.setUTCHours(18, 0, 0, 0);
  const second = new Date(first.getTime() + DAY);

  test.before(async () => {
    const [db] = await setupDatabase();
    await seedTicketing(db);
    adminFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    producerFetch = createLoggedInGraphqlFetch(PRODUCER_B_TOKEN);
  });

  let productionId: string;

  test('a production with two performances in two categories is created in one mutation', async () => {
    const { data, errors } = await adminFetch({
      query: CREATE_PRODUCTION,
      variables: {
        production: {
          texts: [{ locale: 'de', title: 'Hamlet', slug: 'hamlet' }],
          tags: ['organizer-a'],
          location: 'Grosse Bühne',
          durationMinutes: 150,
          saleRules: { maxPerOrder: 6 },
          categories: [
            {
              code: 'adult',
              texts: [{ locale: 'de', title: 'Erwachsene' }],
              capacity: 100,
              pricing: [{ amount: 4500, currencyCode: 'CHF', countryCode: 'CH' }],
            },
            {
              code: 'reduced',
              texts: [{ locale: 'de', title: 'Ermässigt' }],
              capacity: 20,
              pricing: [{ amount: 2500, currencyCode: 'CHF', countryCode: 'CH' }],
            },
          ],
          performances: [
            { startsAt: first.toISOString() },
            { startsAt: second.toISOString(), tickets: [{ category: 'adult', supply: 50 }] },
          ],
        },
      },
    });
    assert.ifError(errors?.[0]);
    const production = data.createTicketProduction;
    productionId = production._id;
    assert.equal(production.status, 'DRAFT');
    assert.deepEqual(production.tags, ['ticket-production', 'organizer-a']);
    assert.deepEqual(production.ticketProduction, {
      location: 'Grosse Bühne',
      durationMinutes: 150,
      doorsOpenMinutesBefore: null,
      saleRules: { salesStart: null, maxPerOrder: 6 },
      categories: [
        {
          code: 'adult',
          capacity: 100,
          pricing: [{ amount: 4500, currencyCode: 'CHF' }],
          option: { value: 'adult', texts: { title: 'Erwachsene' } },
        },
        {
          code: 'reduced',
          capacity: 20,
          pricing: [{ amount: 2500, currencyCode: 'CHF' }],
          option: { value: 'reduced', texts: { title: 'Ermässigt' } },
        },
      ],
    });
    assert.deepEqual(production.assignments.map(vectorOf), [
      { slot: first.toISOString(), category: 'adult' },
      { slot: first.toISOString(), category: 'reduced' },
      { slot: second.toISOString(), category: 'adult' },
      { slot: second.toISOString(), category: 'reduced' },
    ]);
    const [adultFirst, , adultSecond] = production.assignments.map(({ product }) => product);
    assert.equal(new Date(adultFirst.event.startsAt).getTime(), first.getTime());
    assert.equal(adultFirst.event.location, 'Grosse Bühne');
    assert.equal(adultFirst.event.category, 'adult');
    // The name of the category is the text of the production's category option
    assert.equal(adultFirst.event.categoryTitle, 'Erwachsene');
    // The sale rules of the production apply to its performances
    assert.deepEqual(adultFirst.event.saleRules, { salesStart: null, maxPerOrder: 6 });
    assert.equal(adultFirst.contractConfiguration.supply, 100);
    assert.equal(adultSecond.contractConfiguration.supply, 50);
  });

  test('productions, their performances and standalone events are listed separately', async () => {
    const { data, errors } = await adminFetch({
      query: /* GraphQL */ `
        query Lists($productionId: ID!) {
          ticketProductions {
            _id
          }
          ticketProductionsCount
          performances: ticketEvents(productionId: $productionId) {
            _id
          }
          performancesCount: ticketEventsCount(productionId: $productionId)
          standalone: ticketEvents(standalone: true) {
            _id
          }
        }
      `,
      variables: { productionId },
    });
    assert.ifError(errors?.[0]);
    assert.deepEqual(
      data.ticketProductions.map(({ _id }) => _id),
      [productionId],
    );
    assert.equal(data.ticketProductionsCount, 1);
    assert.equal(data.performances.length, 4);
    assert.equal(data.performancesCount, 4);
    const standaloneIds = data.standalone.map(({ _id }) => _id);
    assert.ok(standaloneIds.includes(ConcertEventId));
    assert.ok(!standaloneIds.some((id) => data.performances.some(({ _id }) => _id === id)));
  });

  test('performances are added, changed and removed', async () => {
    const third = new Date(second.getTime() + DAY);
    const added = await adminFetch({
      query: /* GraphQL */ `
        mutation Add($productionId: ID!, $performance: TicketPerformanceInput!) {
          addTicketPerformance(productionId: $productionId, performance: $performance) {
            ...ProductionFields
          }
        }
        ${PRODUCTION_FIELDS}
      `,
      variables: { productionId, performance: { startsAt: third.toISOString(), location: 'Studio' } },
    });
    assert.ifError(added.errors?.[0]);
    assert.equal(added.data.addTicketPerformance.assignments.length, 6);

    const updated = await adminFetch({
      query: /* GraphQL */ `
        mutation Update(
          $productionId: ID!
          $startsAt: DateTimeISO!
          $performance: UpdateTicketPerformanceInput!
        ) {
          updateTicketPerformance(
            productionId: $productionId
            startsAt: $startsAt
            performance: $performance
          ) {
            ...ProductionFields
          }
        }
        ${PRODUCTION_FIELDS}
      `,
      variables: {
        productionId,
        startsAt: third.toISOString(),
        performance: { saleRules: { maxPerOrder: 2 }, tickets: [{ category: 'reduced', supply: 5 }] },
      },
    });
    assert.ifError(updated.errors?.[0]);
    const thirdPerformance = updated.data.updateTicketPerformance.assignments.filter(
      (assignment) => vectorOf(assignment).slot === third.toISOString(),
    );
    assert.deepEqual(thirdPerformance[0].product.event.overridden, ['location']);
    assert.deepEqual(thirdPerformance[0].product.event.saleRules, { salesStart: null, maxPerOrder: 2 });
    assert.equal(thirdPerformance[1].product.contractConfiguration.supply, 5);

    const removed = await adminFetch({
      query: /* GraphQL */ `
        mutation Remove($productionId: ID!, $startsAt: DateTimeISO!) {
          removeTicketPerformance(productionId: $productionId, startsAt: $startsAt) {
            ...ProductionFields
          }
        }
        ${PRODUCTION_FIELDS}
      `,
      variables: { productionId, startsAt: third.toISOString() },
    });
    assert.ifError(removed.errors?.[0]);
    assert.equal(removed.data.removeTicketPerformance.assignments.length, 4);
    const product = await adminFetch({
      query: `query P($productId: ID!) { product(productId: $productId) { _id status } }`,
      variables: { productId: thirdPerformance[0].product._id },
    });
    assert.equal(product.data.product?.status ?? 'DELETED', 'DELETED');
  });

  test('the start and category of a performance only change through its production', async () => {
    const { data } = await adminFetch({
      query: `query E($productionId: ID!) { ticketEvents(productionId: $productionId) { _id } }`,
      variables: { productionId },
    });
    const [performance] = data.ticketEvents;
    const moved = await adminFetch({
      query: /* GraphQL */ `
        mutation Move($productId: ID!, $startsAt: DateTimeISO) {
          updateTicketEvent(productId: $productId, event: { startsAt: $startsAt }) {
            _id
          }
        }
      `,
      variables: { productId: performance._id, startsAt: new Date().toISOString() },
    });
    assert.equal(moved.errors?.[0]?.extensions?.code, 'TicketPerformanceManagedError');

    const located = await adminFetch({
      query: /* GraphQL */ `
        mutation Locate($productId: ID!) {
          updateTicketEvent(productId: $productId, event: { location: "Foyer" }) {
            _id
            ... on TokenizedProduct {
              event {
                location
                overridden
              }
            }
          }
        }
      `,
      variables: { productId: performance._id },
    });
    assert.ifError(located.errors?.[0]);
    assert.deepEqual(located.data.updateTicketEvent.event, {
      location: 'Foyer',
      overridden: ['location'],
    });
  });

  test('producers stay within their organizer scope', async () => {
    const outside = await producerFetch({
      query: CREATE_PRODUCTION,
      variables: { production: { texts: [{ locale: 'de', title: 'Faust' }], tags: ['organizer-a'] } },
    });
    assert.match(outside.errors?.[0]?.message ?? '', /permission/i);

    const own = await producerFetch({
      query: CREATE_PRODUCTION,
      variables: {
        production: {
          texts: [{ locale: 'de', title: 'Faust' }],
          tags: ['organizer-b'],
          performances: [
            {
              startsAt: first.toISOString(),
              tickets: [
                { supply: 10, pricing: [{ amount: 3000, currencyCode: 'CHF', countryCode: 'CH' }] },
              ],
            },
          ],
        },
      },
    });
    assert.ifError(own.errors?.[0]);
    assert.deepEqual(own.data.createTicketProduction.assignments.map(vectorOf), [
      { slot: first.toISOString() },
    ]);

    const foreign = await producerFetch({
      query: /* GraphQL */ `
        mutation Add($productionId: ID!) {
          addTicketPerformance(
            productionId: $productionId
            performance: { startsAt: "2030-01-01T18:00:00Z" }
          ) {
            _id
          }
        }
      `,
      variables: { productionId },
    });
    assert.match(foreign.errors?.[0]?.message ?? '', /permission/i);

    const listed = await producerFetch({
      query: '{ ticketProductions { _id } ticketProductionsCount }',
    });
    assert.ifError(listed.errors?.[0]);
    assert.deepEqual(
      listed.data.ticketProductions.map(({ _id }) => _id),
      [own.data.createTicketProduction._id],
    );
    assert.equal(listed.data.ticketProductionsCount, 1);
  });

  test('checkout applies the sale rules of the production', async () => {
    const { data } = await adminFetch({
      query: `query E($productionId: ID!) { ticketEvents(productionId: $productionId) { _id } }`,
      variables: { productionId },
    });
    await adminFetch({
      query: `mutation P($productionId: ID!) { publishTicketProduction(productionId: $productionId) { _id } }`,
      variables: { productionId },
    });
    const tooMany = await adminFetch({
      query: /* GraphQL */ `
        mutation Add($productId: ID!) {
          addCartProduct(productId: $productId, quantity: 7) {
            _id
          }
        }
      `,
      variables: { productId: data.ticketEvents[0]._id },
    });
    assert.equal(tooMany.errors?.[0]?.extensions?.code, 'TicketOrderLimitExceededError');
  });
});

test.describe('Ticketing: production changes', () => {
  let adminFetch;
  const start = new Date(Date.now() + 20 * DAY);
  start.setUTCHours(19, 30, 0, 0);

  const run = async (query: string, variables: Record<string, unknown>) => {
    const { data, errors } = await adminFetch({ query: `${query}\n${PRODUCTION_FIELDS}`, variables });
    assert.ifError(errors?.[0]);
    return Object.values(data)[0] as any;
  };

  test.before(async () => {
    adminFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  test('changes, categories, cancellation and removal of a production', async () => {
    const created = await run(
      /* GraphQL */ `
        mutation Create($production: CreateTicketProductionInput!) {
          createTicketProduction(production: $production) {
            ...ProductionFields
          }
        }
      `,
      {
        production: {
          texts: [{ locale: 'de', title: 'Faust', slug: 'faust' }],
          location: 'Saal',
          categories: [
            {
              code: 'adult',
              capacity: 10,
              pricing: [{ amount: 3000, currencyCode: 'CHF', countryCode: 'CH' }],
            },
          ],
          performances: [{ startsAt: start.toISOString() }],
        },
      },
    );
    const productionId = created._id;

    const changed = await run(
      /* GraphQL */ `
        mutation Change($productionId: ID!, $production: UpdateTicketProductionInput!) {
          updateTicketProduction(productionId: $productionId, production: $production) {
            ...ProductionFields
          }
        }
      `,
      {
        productionId,
        production: {
          texts: [{ locale: 'de', title: 'Faust I' }],
          location: 'Grosser Saal',
          saleRules: { onSale: true },
        },
      },
    );
    assert.equal(changed.ticketProduction.location, 'Grosser Saal');
    assert.equal(changed.assignments[0].product.event.location, 'Grosser Saal');

    const withBox = await run(
      /* GraphQL */ `
        mutation AddCategory($productionId: ID!, $category: TicketCategoryInput!) {
          addTicketCategory(productionId: $productionId, category: $category) {
            ...ProductionFields
          }
        }
      `,
      {
        productionId,
        category: {
          code: 'box',
          texts: [{ locale: 'de', title: 'Loge' }],
          capacity: 4,
          pricing: [{ amount: 9000, currencyCode: 'CHF', countryCode: 'CH' }],
        },
      },
    );
    assert.deepEqual(
      withBox.ticketProduction.categories.map(({ code }) => code),
      ['adult', 'box'],
    );
    assert.equal(withBox.assignments.length, 2);

    const resized = await run(
      /* GraphQL */ `
        mutation Resize($productionId: ID!, $code: String!, $category: UpdateTicketCategoryInput!) {
          updateTicketCategory(
            productionId: $productionId
            code: $code
            category: $category
            applyToPerformances: true
          ) {
            ...ProductionFields
          }
        }
      `,
      { productionId, code: 'box', category: { capacity: 6 } },
    );
    const box = resized.assignments.find((assignment) => vectorOf(assignment).category === 'box');
    assert.equal(box.product.contractConfiguration.supply, 6);

    const withoutBox = await run(
      /* GraphQL */ `
        mutation RemoveCategory($productionId: ID!, $code: String!) {
          removeTicketCategory(productionId: $productionId, code: $code) {
            ...ProductionFields
          }
        }
      `,
      { productionId, code: 'box' },
    );
    assert.equal(withoutBox.assignments.length, 1);

    const synced = await run(
      /* GraphQL */ `
        mutation Sync($productionId: ID!) {
          syncTicketProduction(productionId: $productionId) {
            ...ProductionFields
          }
        }
      `,
      { productionId },
    );
    assert.equal(synced._id, productionId);

    await run(
      /* GraphQL */ `
        mutation Publish($productionId: ID!) {
          publishTicketProduction(productionId: $productionId) {
            ...ProductionFields
          }
        }
      `,
      { productionId },
    );
    const { data: cancelled, errors: cancelErrors } = await adminFetch({
      query: /* GraphQL */ `
        mutation Cancel($productionId: ID!, $startsAt: DateTimeISO!) {
          cancelTicketPerformance(productionId: $productionId, startsAt: $startsAt)
        }
      `,
      variables: { productionId, startsAt: start.toISOString() },
    });
    assert.ifError(cancelErrors?.[0]);
    assert.equal(cancelled.cancelTicketPerformance, 0);
    const afterCancel = await run(
      /* GraphQL */ `
        query Production($productId: ID!) {
          product(productId: $productId) {
            ...ProductionFields
          }
        }
      `,
      { productId: productionId },
    );
    const { data: event } = await adminFetch({
      query: `query E($productId: ID!) { product(productId: $productId) { ... on TokenizedProduct { event { isCanceled } } } }`,
      variables: { productId: afterCancel.assignments[0].product._id },
    });
    assert.equal(event.product.event.isCanceled, true);

    const { data: removed, errors: removeErrors } = await adminFetch({
      query: /* GraphQL */ `
        mutation Remove($productionId: ID!) {
          removeTicketProduction(productionId: $productionId) {
            _id
            status
          }
        }
      `,
      variables: { productionId },
    });
    assert.ifError(removeErrors?.[0]);
    assert.equal(removed.removeTicketProduction.status, 'DELETED');
    const { data: performance } = await adminFetch({
      query: `query P($productId: ID!) { product(productId: $productId) { _id status } }`,
      variables: { productId: afterCancel.assignments[0].product._id },
    });
    assert.equal(performance.product?.status ?? 'DELETED', 'DELETED');
  });
});
