import { setupDatabase, createAnonymousGraphqlFetch, createLoggedInGraphqlFetch } from './helpers.js';
import { ConfirmedOrder, PendingOrder, SimpleOrder } from './seeds/orders.js';
import { USER_TOKEN, ADMIN_TOKEN } from './seeds/users.js';

let graphqlFetch;
let adminGraphqlFetch;
let graphqlFetchAsAnonymousUser;

describe('Order: Management', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(USER_TOKEN);
    adminGraphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
    graphqlFetchAsAnonymousUser = await createAnonymousGraphqlFetch();
  });

  describe('Query.ordersCount for logged in user should', () => {
    it('return total number of current user orders', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          query ordersCount {
            ordersCount
          }
        `,
        variables: {},
      });
      expect(errors[0]?.extensions.code).toEqual('NoPermissionError');
    });

    it('return result of Search by order number', async () => {
      const {
        data: { orders },
      } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          query orders($queryString: String) {
            orders(queryString: $queryString) {
              _id

              orderNumber
            }
          }
        `,
        variables: {
          queryString: 'O0011',
        },
      });

      expect(orders).toMatchObject([
        {
          _id: ConfirmedOrder._id,
          orderNumber: ConfirmedOrder.orderNumber,
        },
      ]);
    });
  });

  describe('Query.ordersCount for admin user should', () => {
    it('return total number of current user orders', async () => {
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
      expect(ordersCount).toEqual(2);
    });
  });

  describe('Query.ordersCount for anonymous user', () => {
    it('should return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query ordersCount {
            ordersCount
          }
        `,
        variables: {},
      });
      expect(errors[0]?.extensions.code).toEqual('NoPermissionError');
    });
  });

  describe('Query.orders for loggedin user should', () => {
    it('return array of current user orders', async () => {
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

      expect(orders.length).toEqual(2);
      expect(orders).toMatchObject([
        {
          _id: ConfirmedOrder._id,
          status: ConfirmedOrder.status,
        },
        {
          _id: PendingOrder._id,
          status: PendingOrder.status,
        },
      ]);
    });

    it('return single user order', async () => {
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
      expect(order._id).toEqual(SimpleOrder._id);
    });

    it('return simulatedPrice for supportedDeliveryProviders using default country currency when currency is not provided', async () => {
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
                  currency
                }
              }
            }
          }
        `,
        variables: {
          orderId: SimpleOrder._id,
        },
      });
      expect(order.supportedDeliveryProviders?.[0]?.simulatedPrice).toMatchObject({
        currency: 'CHF',
        amount: 0,
      });
    });

    it('return simulatedPrice for supportedDeliveryProviders using the provided currency when currency is provided', async () => {
      const {
        data: { order },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query order($orderId: ID!) {
            order(orderId: $orderId) {
              _id
              supportedDeliveryProviders {
                _id
                simulatedPrice(currency: "EUR") {
                  amount
                  currency
                }
              }
            }
          }
        `,
        variables: {
          orderId: SimpleOrder._id,
        },
      });

      expect(order.supportedDeliveryProviders?.[0]?.simulatedPrice?.currency).toEqual('EUR');
    });
  });

  describe('Query.orders for anonymous user', () => {
    it('should return error', async () => {
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
      expect(errors[0]?.extensions.code).toEqual('NoPermissionError');
    });
  });

  describe('Query.orders for admin user', () => {
    it('return error when passed invalid orderId and user is admin', async () => {
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

      expect(order).toBe(null);
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });
});
