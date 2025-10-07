import test from 'node:test';
import assert from 'node:assert';
import {
  setupDatabase,
  createAnonymousGraphqlFetch,
  createLoggedInGraphqlFetch,
  disconnect,
} from './helpers.js';
import { ConfirmedOrder, PendingOrder, SimpleOrder } from './seeds/orders.js';
import { USER_TOKEN, ADMIN_TOKEN } from './seeds/users.js';

test.describe('Order: Lists', () => {
  let graphqlFetch;
  let adminGraphqlFetch;
  let graphqlFetchAsAnonymousUser;

  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);
    adminGraphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  // Query.ordersCount for logged in user
  test('Query.ordersCount for logged in user should return NoPermissionError', async () => {
    const { errors } = await graphqlFetch({
      query: /* GraphQL */ `
        query ordersCount {
          ordersCount
        }
      `,
      variables: {},
    });
    assert.strictEqual(errors[0]?.extensions.code, 'NoPermissionError');
  });

  // Query.ordersCount for admin user
  test('Query.ordersCount for admin user should return total number of orders', async () => {
    const {
      data: { ordersCount },
    } = await adminGraphqlFetch({
      query: /* GraphQL */ `
        query ordersCount {
          ordersCount
        }
      `,
      variables: {},
    });
    assert.strictEqual(ordersCount, 2);
  });

  // Query.ordersCount for anonymous user
  test('Query.ordersCount for anonymous user should return NoPermissionError', async () => {
    const { errors } = await graphqlFetchAsAnonymousUser({
      query: /* GraphQL */ `
        query ordersCount {
          ordersCount
        }
      `,
      variables: {},
    });
    assert.strictEqual(errors[0]?.extensions.code, 'NoPermissionError');
  });

  // Query.orders for logged in user
  test('Query.orders for logged in user should return array of current user orders', async () => {
    const {
      data: {
        me: { orders },
      },
    } = await graphqlFetch({
      query: /* GraphQL */ `
        query orders {
          me {
            orders {
              _id
              status
              created
              updated
              ordered
              orderNumber
              confirmed
              fullfilled
              contact {
                telNumber
                emailAddress
              }
              country {
                _id
              }
              currency {
                _id
              }
              billingAddress {
                firstName
              }
              items {
                _id
              }
              discounts {
                _id
              }
              total {
                amount
              }
              supportedDeliveryProviders {
                _id
              }
              supportedPaymentProviders {
                _id
              }
            }
          }
        }
      `,
      variables: {},
    });

    assert.strictEqual(orders.length, 2);

    assert.partialDeepStrictEqual(
      orders.find((o) => o._id === PendingOrder._id),
      {
        status: PendingOrder.status,
      },
    );

    assert.partialDeepStrictEqual(
      orders.find((o) => o._id === ConfirmedOrder._id),
      {
        status: ConfirmedOrder.status,
      },
    );
  });

  test('Query.orders for logged in user should return single user order', async () => {
    const {
      data: { order },
    } = await graphqlFetch({
      query: /* GraphQL */ `
        query order($orderId: ID!) {
          order(orderId: $orderId) {
            _id
            status
            created
            updated
            ordered
            orderNumber
            confirmed
            fullfilled
            contact {
              telNumber
              emailAddress
            }
            country {
              _id
            }
            currency {
              _id
            }
            billingAddress {
              firstName
            }
            items {
              _id
            }
            discounts {
              _id
            }
            total {
              amount
            }
            supportedDeliveryProviders {
              _id
            }
            supportedPaymentProviders {
              _id
            }
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
      },
    });
    assert.strictEqual(order._id, SimpleOrder._id);
  });

  test('Query.orders for logged in user should return simulatedPrice for supportedDeliveryProviders using default country currency when currency is not provided', async () => {
    const {
      data: { order },
    } = await graphqlFetch({
      query: /* GraphQL */ `
        query order($orderId: ID!) {
          order(orderId: $orderId) {
            _id
            supportedDeliveryProviders {
              _id
              simulatedPrice {
                amount
                currencyCode
              }
            }
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
      },
    });
    assert.deepStrictEqual(order.supportedDeliveryProviders?.[0]?.simulatedPrice, {
      currencyCode: 'CHF',
      amount: 0,
    });
  });

  test('Query.orders for logged in user should return simulatedPrice for supportedDeliveryProviders using the provided currency when currency is provided', async () => {
    const {
      data: { order },
    } = await graphqlFetch({
      query: /* GraphQL */ `
        query order($orderId: ID!) {
          order(orderId: $orderId) {
            _id
            supportedDeliveryProviders {
              _id
              simulatedPrice(currencyCode: "EUR") {
                amount
                currencyCode
              }
            }
          }
        }
      `,
      variables: {
        orderId: SimpleOrder._id,
      },
    });

    assert.strictEqual(order.supportedDeliveryProviders?.[0]?.simulatedPrice?.currencyCode, 'EUR');
  });

  // Query.orders for anonymous user
  test('Query.orders for anonymous user should return error', async () => {
    const { errors } = await graphqlFetchAsAnonymousUser({
      query: /* GraphQL */ `
        query orders {
          orders {
            _id
            user {
              username
            }
          }
        }
      `,
      variables: {},
    });
    assert.strictEqual(errors[0]?.extensions.code, 'NoPermissionError');
  });

  // Query.orders for admin user
  test('Query.orders for admin user should return error when passed invalid orderId and user is admin', async () => {
    const {
      data: { order },
      errors,
    } = await adminGraphqlFetch({
      query: /* GraphQL */ `
        query order($orderId: ID!) {
          order(orderId: $orderId) {
            _id
          }
        }
      `,
      variables: {
        orderId: '',
      },
    });

    assert.strictEqual(order, null);
    assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
  });

  test('Query.orderStatistics for admin user should return statistics', async () => {
    const {
      data: { orderStatistics },
    } = await adminGraphqlFetch({
      query: /* GraphQL */ `
        query OrderStatistics {
          orderStatistics {
            newCount
            checkoutCount
            rejectCount
            confirmCount
            fulfillCount
            confirmRecords {
              total {
                amount
                currencyCode
              }
            }
            checkoutRecords {
              total {
                amount
                currencyCode
              }
            }
            rejectRecords {
              total {
                amount
                currencyCode
              }
            }
            newRecords {
              total {
                amount
                currencyCode
              }
            }
            fulfilledRecords {
              total {
                amount
                currencyCode
              }
            }
          }
        }
      `,
      variables: {},
    });
    assert.strictEqual(orderStatistics.newCount, 2);
    assert.strictEqual(orderStatistics.checkoutCount, 2);
    assert.strictEqual(orderStatistics.confirmCount, 2);
    assert.strictEqual(Array.isArray(orderStatistics.confirmRecords), true);
    assert.strictEqual(Array.isArray(orderStatistics.checkoutRecords), true);
  });

  test('Query.orderStatistics for admin user should return statistics filtered by date range', async () => {
    const now = new Date();
    const tenYearsAgo = new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);
    const oneYearInFuture = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const {
      data: { orderStatistics },
    } = await adminGraphqlFetch({
      query: /* GraphQL */ `
        query OrderStatistics($dateRange: DateFilterInput) {
          orderStatistics(dateRange: $dateRange) {
            newCount
            confirmCount
            fulfillCount
          }
        }
      `,
      variables: {
        dateRange: {
          start: tenYearsAgo.toISOString(),
          end: oneYearInFuture.toISOString(),
        },
      },
    });
    assert.ok(orderStatistics);
    assert.strictEqual(orderStatistics.confirmCount, 1);
    assert.strictEqual(orderStatistics.newCount, 2);
    assert.strictEqual(orderStatistics.fulfillCount, 0);
  });

  test('Query.orderStatistics for normal user should return NoPermissionError', async () => {
    const { errors } = await graphqlFetch({
      query: /* GraphQL */ `
        query OrderStatistics {
          orderStatistics {
            newCount
            confirmCount
          }
        }
      `,
      variables: {},
    });
    assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
  });

  test('Query.orderStatistics for anonymous user should return NoPermissionError', async () => {
    const { errors } = await graphqlFetchAsAnonymousUser({
      query: /* GraphQL */ `
        query OrderStatistics {
          orderStatistics {
            newCount
            confirmCount
          }
        }
      `,
      variables: {},
    });
    assert.strictEqual(errors[0]?.extensions?.code, 'NoPermissionError');
  });
});
