import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';
import { TestEvent1, TestEvent3, TestEvent4 } from './seeds/events.js';
import assert from 'node:assert';
import test from 'node:test';

test.describe('Events', () => {
  let graphqlFetch;
  let graphqlFetchAsNormalUser;
  let graphqlFetchAsAnonymousUser;

  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsNormalUser = createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Query.events for admin user should', () => {
    test('Return all events when no arguments passed', async () => {
      const {
        data: { events },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Events {
            events {
              _id
              type
              created
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(events.length, 4);
    });

    test('Return events with all fields', async () => {
      const {
        data: { events },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Events {
            events {
              _id
              type
              created
              payload
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(events.length, 4);
      assert.strictEqual(events[0]._id, TestEvent4._id);
      assert.strictEqual(events[0].type, TestEvent4.type);
    });

    test('Return events filtered by type', async () => {
      const {
        data: { events },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Events($types: [String!]) {
            events(types: $types) {
              _id
              type
            }
          }
        `,
        variables: {
          types: ['ORDER_CREATE'],
        },
      });
      assert.strictEqual(events.length, 2);
      assert.strictEqual(events[0].type, 'ORDER_CREATE');
      assert.strictEqual(events[1].type, 'ORDER_CREATE');
    });

    test('Return events filtered by multiple types', async () => {
      const {
        data: { events },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Events($types: [String!]) {
            events(types: $types) {
              _id
              type
            }
          }
        `,
        variables: {
          types: ['USER_CREATE', 'PRODUCT_CREATE'],
        },
      });
      assert.strictEqual(events.length, 2);
    });

    test('Return events with limit', async () => {
      const {
        data: { events },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Events($limit: Int) {
            events(limit: $limit) {
              _id
              type
            }
          }
        `,
        variables: {
          limit: 2,
        },
      });
      assert.strictEqual(events.length, 2);
    });

    test('Return events with offset', async () => {
      const {
        data: { events },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Events($offset: Int) {
            events(offset: $offset) {
              _id
              type
            }
          }
        `,
        variables: {
          offset: 2,
        },
      });
      assert.strictEqual(events.length, 2);
    });

    test('Return events with limit and offset', async () => {
      const {
        data: { events },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Events($limit: Int, $offset: Int) {
            events(limit: $limit, offset: $offset) {
              _id
              type
            }
          }
        `,
        variables: {
          limit: 1,
          offset: 1,
        },
      });
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0]._id, TestEvent3._id);
    });

    test('Return events filtered by created date range', async () => {
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

      const {
        data: { events },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Events($created: DateFilterInput) {
            events(created: $created) {
              _id
              type
              created
            }
          }
        `,
        variables: {
          created: {
            start: threeHoursAgo.toISOString(),
            end: thirtyMinutesAgo.toISOString(),
          },
        },
      });
      assert.strictEqual(events.length, 2);
    });

    test('Return events sorted by created ascending', async () => {
      const {
        data: { events },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Events($sort: [SortOptionInput!]) {
            events(sort: $sort) {
              _id
              type
              created
            }
          }
        `,
        variables: {
          sort: [{ key: 'created', value: 'ASC' }],
        },
      });
      assert.strictEqual(events.length, 4);
      assert.strictEqual(events[0]._id, TestEvent1._id);
      assert.strictEqual(events[3]._id, TestEvent4._id);
    });

    test('Return events filtered by queryString', async () => {
      const {
        data: { events },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Events($queryString: String) {
            events(queryString: $queryString) {
              _id
              type
            }
          }
        `,
        variables: {
          queryString: 'USER_CREATE',
        },
      });
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].type, 'USER_CREATE');
    });
  });

  test.describe('Query.eventsCount for admin user should', () => {
    test('Return total count of all events when no arguments passed', async () => {
      const {
        data: { eventsCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            eventsCount
          }
        `,
        variables: {},
      });
      assert.strictEqual(eventsCount, 4);
    });

    test('Return count of events filtered by type', async () => {
      const {
        data: { eventsCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query EventsCount($types: [String!]) {
            eventsCount(types: $types)
          }
        `,
        variables: {
          types: ['ORDER_CREATE'],
        },
      });
      assert.strictEqual(eventsCount, 2);
    });

    test('Return count of events filtered by multiple types', async () => {
      const {
        data: { eventsCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query EventsCount($types: [String!]) {
            eventsCount(types: $types)
          }
        `,
        variables: {
          types: ['USER_CREATE', 'PRODUCT_CREATE'],
        },
      });
      assert.strictEqual(eventsCount, 2);
    });

    test('Return count of events filtered by created date range', async () => {
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

      const {
        data: { eventsCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query EventsCount($created: DateFilterInput) {
            eventsCount(created: $created)
          }
        `,
        variables: {
          created: {
            start: threeHoursAgo.toISOString(),
            end: thirtyMinutesAgo.toISOString(),
          },
        },
      });
      assert.strictEqual(eventsCount, 2);
    });

    test('Return count of events filtered by queryString', async () => {
      const {
        data: { eventsCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query EventsCount($queryString: String) {
            eventsCount(queryString: $queryString)
          }
        `,
        variables: {
          queryString: 'USER_CREATE',
        },
      });
      assert.strictEqual(eventsCount, 1);
    });

    test('Return count with combined filters', async () => {
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

      const {
        data: { eventsCount },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query EventsCount($types: [String!], $created: DateFilterInput) {
            eventsCount(types: $types, created: $created)
          }
        `,
        variables: {
          types: ['ORDER_CREATE'],
          created: {
            start: threeHoursAgo.toISOString(),
            end: oneHourAgo.toISOString(),
          },
        },
      });
      assert.strictEqual(eventsCount, 1);
    });
  });

  test.describe('Query.eventsCount for normal user should', () => {
    test('Return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query EventsCount($types: [String!]) {
            eventsCount(types: $types)
          }
        `,
        variables: {
          types: ['ORDER_CREATE'],
        },
      });
      assert.strictEqual(errors[0]?.extensions.code, 'NoPermissionError');
    });
  });

  test.describe('Query.eventsCount for anonymous user should', () => {
    test('Return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query {
            eventsCount
          }
        `,
        variables: {},
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Query.events for normal user should', () => {
    test('Return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query Events($types: [String!]) {
            events(types: $types) {
              _id
              type
            }
          }
        `,
        variables: {
          types: ['USER_CREATE'],
        },
      });
      assert.strictEqual(errors[0]?.extensions.code, 'NoPermissionError');
    });
  });

  test.describe('Query.events for anonymous user should', () => {
    test('Return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query Events {
            events {
              _id
              type
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Query.event for admin user should', () => {
    test('Return single event by ID', async () => {
      const {
        data: { event },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Event($eventId: ID!) {
            event(eventId: $eventId) {
              _id
              type
              created
              payload
            }
          }
        `,
        variables: {
          eventId: TestEvent1._id,
        },
      });
      assert.strictEqual(event._id, TestEvent1._id);
      assert.strictEqual(event.type, TestEvent1.type);
    });

    test('Return null for non-existing event ID', async () => {
      const {
        data: { event },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query Event($eventId: ID!) {
            event(eventId: $eventId) {
              _id
              type
            }
          }
        `,
        variables: {
          eventId: 'non-existing-event-id',
        },
      });
      assert.strictEqual(event, null);
    });
  });

  test.describe('Query.event for normal user should', () => {
    test('Return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query Event($eventId: ID!) {
            event(eventId: $eventId) {
              _id
              type
            }
          }
        `,
        variables: {
          eventId: TestEvent1._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Query.event for anonymous user should', () => {
    test('Return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query Event($eventId: ID!) {
            event(eventId: $eventId) {
              _id
              type
            }
          }
        `,
        variables: {
          eventId: TestEvent1._id,
        },
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Query.eventStatistics for admin user should', () => {
    test('Return statistics for all events', async () => {
      const {
        data: { eventStatistics },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query EventStatistics {
            eventStatistics {
              type
              emitCount
              detail {
                date
                count
              }
            }
          }
        `,
        variables: {},
      });
      // Core events + ACL_GRANTED_SENSITIVE from sensitive action checks
      assert.ok(
        eventStatistics.length >= 3,
        `Expected at least 3 events, got ${eventStatistics.length}`,
      );

      const orderStats = eventStatistics.find((s) => s.type === 'ORDER_CREATE');
      assert.strictEqual(orderStats.emitCount, 2);

      const userStats = eventStatistics.find((s) => s.type === 'USER_CREATE');
      assert.strictEqual(userStats.emitCount, 1);

      const productStats = eventStatistics.find((s) => s.type === 'PRODUCT_CREATE');
      assert.strictEqual(productStats.emitCount, 1);
    });

    test('Return statistics filtered by type', async () => {
      const {
        data: { eventStatistics },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query EventStatistics($types: [String!]) {
            eventStatistics(types: $types) {
              type
              emitCount
              detail {
                date
                count
              }
            }
          }
        `,
        variables: {
          types: ['ORDER_CREATE'],
        },
      });
      assert.strictEqual(eventStatistics.length, 1);
      assert.strictEqual(eventStatistics[0].type, 'ORDER_CREATE');
      assert.strictEqual(eventStatistics[0].emitCount, 2);
    });

    test('Return statistics filtered by multiple types', async () => {
      const {
        data: { eventStatistics },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query EventStatistics($types: [String!]) {
            eventStatistics(types: $types) {
              type
              emitCount
            }
          }
        `,
        variables: {
          types: ['USER_CREATE', 'PRODUCT_CREATE'],
        },
      });
      assert.strictEqual(eventStatistics.length, 2);
    });

    test('Return statistics filtered by date range', async () => {
      const now = new Date();
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      const thirtyMinutesInFuture = new Date(now.getTime() + 30 * 60 * 1000);

      const {
        data: { eventStatistics },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query EventStatistics($dateRange: DateFilterInput) {
            eventStatistics(dateRange: $dateRange) {
              type
              emitCount
            }
          }
        `,
        variables: {
          dateRange: {
            start: fourHoursAgo.toISOString(),
            end: thirtyMinutesInFuture.toISOString(),
          },
        },
      });
      // Core events + ACL_GRANTED_SENSITIVE from sensitive action checks
      assert.ok(
        eventStatistics.length >= 3,
        `Expected at least 3 events, got ${eventStatistics.length}`,
      );
    });

    test('Return statistics with combined filters', async () => {
      const now = new Date();
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      const thirtyMinutesInFuture = new Date(now.getTime() + 30 * 60 * 1000);

      const {
        data: { eventStatistics },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query EventStatistics($types: [String!], $dateRange: DateFilterInput) {
            eventStatistics(types: $types, dateRange: $dateRange) {
              type
              emitCount
            }
          }
        `,
        variables: {
          types: ['ORDER_CREATE'],
          dateRange: {
            start: fourHoursAgo.toISOString(),
            end: thirtyMinutesInFuture.toISOString(),
          },
        },
      });
      assert.strictEqual(eventStatistics.length, 1);
      assert.strictEqual(eventStatistics[0].type, 'ORDER_CREATE');
      assert.strictEqual(eventStatistics[0].emitCount, 2);
    });
  });

  test.describe('Query.eventStatistics for normal user should', () => {
    test('Return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query EventStatistics {
            eventStatistics {
              type
              emitCount
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });

  test.describe('Query.eventStatistics for anonymous user should', () => {
    test('Return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query EventStatistics {
            eventStatistics {
              type
              emitCount
            }
          }
        `,
        variables: {},
      });
      assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
    });
  });
});
