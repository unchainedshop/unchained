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

  describe('Query.order for loggedin user', () => {
    it('should return array of current user orders', async () => {
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

    it('should return single user order', async () => {
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

    it('return permission error when passed non existing orderId and user is not admin', async () => {
      const {
        data: { order },
        errors,
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query order($orderId: ID!) {
            order(orderId: $orderId) {
              _id
            }
          }
        `,
        variables: {
          orderId: 'non-existing-id',
        },
      });

      expect(order).toBe(null);
      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });

    it('return not found error when passed non existing orderId and user is admin', async () => {
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
          orderId: 'non-existing-id',
        },
      });

      expect(order).toBe(null);
      expect(errors[0]?.extensions?.code).toEqual('OrderNotFoundError');
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
