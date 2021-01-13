import {
  setupDatabase,
  createAnonymousGraphqlFetch,
  createLoggedInGraphqlFetch,
} from './helpers';
import { SimpleOrder } from './seeds/orders';
import { USER_TOKEN, ADMIN_TOKEN } from './seeds/users';

let connection;
let graphqlFetch;
let adminGraphqlFetch;

describe('Order: Management', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(USER_TOKEN);
    adminGraphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Query.order for loggedin user should', () => {
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
                meta
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
                documents {
                  _id
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
              meta
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
              documents {
                _id
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
                  _id
                  price {
                    amount
                    currency
                  }
                }
              }
            }
          }
        `,
        variables: {
          orderId: SimpleOrder._id,
        },
      });

      expect(
        order.supportedDeliveryProviders?.[0]?.simulatedPrice?.price.currency,
      ).toEqual('CHF');
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
                  _id
                  price {
                    amount
                    currency
                  }
                }
              }
            }
          }
        `,
        variables: {
          orderId: SimpleOrder._id,
        },
      });

      expect(
        order.supportedDeliveryProviders?.[0]?.simulatedPrice?.price.currency,
      ).toEqual('EUR');
    });

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

  describe('Query.orders for anonymous user', () => {
    it('should return error', async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
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
      expect(errors.length).toEqual(1);
    });
  });
});
