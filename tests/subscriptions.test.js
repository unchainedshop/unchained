import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { PlanProduct } from './seeds/products';
import { USER_TOKEN } from './seeds/users';

let connection;
let graphqlFetchAsAdminUser;
let graphqlFetchAsNormalUser;
let graphqlFetchAsAnonymousUser;

describe('Subscriptions', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetchAsAdminUser = await createLoggedInGraphqlFetch();
    graphqlFetchAsNormalUser = await createLoggedInGraphqlFetch(USER_TOKEN);
    graphqlFetchAsAnonymousUser = createAnonymousGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.createCart (Subscription)', () => {
    it('checking out a plan product generates a new subscription', async () => {
      const { data: { createCart } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation {
            createCart(orderNumber: "subscriptionCart") {
              _id
              orderNumber
            }
          }
        `,
      });
      const { data: { checkoutCart } = {} } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation prepareAndCheckout(
            $productId: ID!
            $quantity: Int
            $orderId: ID
            $billingAddress: AddressInput
            $contact: ContactInput
            $meta: JSON
          ) {
            addCartProduct(
              productId: $productId
              quantity: $quantity
              orderId: $orderId
            ) {
              _id
              quantity
            }
            updateCart(
              orderId: $orderId
              billingAddress: $billingAddress
              contact: $contact
              meta: $meta
            ) {
              _id
              billingAddress {
                firstName
              }
            }
            checkoutCart(orderId: $orderId) {
              _id
              orderNumber
              status
              subscription {
                _id
                status
              }
            }
          }
        `,
        variables: {
          productId: PlanProduct._id,
          orderId: createCart._id,
          quantity: 1,
          billingAddress: {
            firstName: 'Hallo',
            lastName: 'Velo',
            addressLine: 'Strasse 1',
            addressLine2: 'Postfach',
            postalCode: '8000',
            city: 'Zürich',
          },
          contact: {
            emailAddress: 'hello@unchained.shop',
            telNumber: '+41999999999',
          },
          meta: {
            hi: 'there',
          },
        },
      });
      expect(checkoutCart).toMatchObject({
        orderNumber: 'subscriptionCart',
        status: 'CONFIRMED',
        subscription: {
          _id: expect.anything(),
          status: 'ACTIVE',
        },
      });
    });
  });
  describe('Mutation.createSubscription', () => {
    it('create a new subscription manually will not activate automatically because of missing order', async () => {
      const {
        data: { createSubscription } = {},
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation createSubscription($plan: SubscriptionPlanInput!) {
            createSubscription(plan: $plan) {
              _id
              status
              subscriptionNumber
              updated
              expires
              meta
              plan {
                product {
                  _id
                }
                quantity
                configuration {
                  key
                  value
                }
              }
              payment {
                provider {
                  _id
                }
              }
              delivery {
                provider {
                  _id
                }
              }
              billingAddress {
                firstName
              }
              contact {
                emailAddress
              }
              status
              created
              expires
              isExpired
              subscriptionNumber
              country {
                isoCode
              }
              currency {
                isoCode
              }
              meta
              periods {
                order {
                  _id
                }
                start
                end
              }
            }
          }
        `,
        variables: {
          plan: {
            productId: PlanProduct._id,
          },
        },
      });
      expect(createSubscription).toMatchObject({
        status: 'INITIAL',
        plan: {
          product: {
            _id: PlanProduct._id,
          },
        },
      });
    });

    it('return not found error when passed non existing productId', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation createSubscription($plan: SubscriptionPlanInput!) {
            createSubscription(plan: $plan) {
              _id
            }
          }
        `,
        variables: {
          plan: {
            productId: 'invalid-id',
          },
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return error when passed invalid productId', async () => {
      const { errors } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          mutation createSubscription($plan: SubscriptionPlanInput!) {
            createSubscription(plan: $plan) {
              _id
            }
          }
        `,
        variables: {
          plan: {
            productId: '',
          },
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });
  describe('Mutation.terminateSubscription', () => {
    it.todo('Mutation.terminateSubscription');
  });
  describe('Mutation.updateSubscription', () => {
    it.todo('Mutation.updateSubscription');
  });
  describe('Mutation.activateSubscription', () => {
    it.todo('Mutation.activateSubscription');
  });

  describe('query.subscriptions for admin user should', () => {
    it('return list of subscriptions', async () => {
      const {
        data: { subscriptions },
      } = await graphqlFetchAsAdminUser({
        query: /* GraphQL */ `
          query subscriptions($limit: Int, $offset: Int) {
            subscriptions(limit: $limit, offset: $offset) {
              _id
              status
              created
              expires
              updated
              isExpired
              subscriptionNumber
              meta
              logs(limit: 10, offset: 0) {
                _id
              }
              periods {
                start
                end
                isTrial
                order {
                  _id
                }
              }
              plan {
                product {
                  _id
                }
                quantity
              }
              payment {
                provider {
                  _id
                }
                meta
              }
              user {
                _id
              }
              billingAddress {
                firstName
              }
              contact {
                telNumber
                emailAddress
              }
              country {
                _id
              }
              currency {
                _id
                isoCode
              }
              meta
            }
          }
        `,
        variables: {},
      });
      expect(subscriptions.length > 0).toBe(true);
    });
  });

  describe('query.subscriptions for normal user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsNormalUser({
        query: /* GraphQL */ `
          query subscriptions($limit: Int, $offset: Int) {
            subscriptions(limit: $limit, offset: $offset) {
              _id
            }
          }
        `,
        variables: {},
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });

  describe('query.subscriptions for anonymous user should', () => {
    it('return NoPermissionError', async () => {
      const { errors } = await graphqlFetchAsAnonymousUser({
        query: /* GraphQL */ `
          query subscriptions($limit: Int, $offset: Int) {
            subscriptions(limit: $limit, offset: $offset) {
              _id
            }
          }
        `,
        variables: {},
      });

      expect(errors[0]?.extensions?.code).toEqual('NoPermissionError');
    });
  });
  describe('query.subscription', () => {
    it.todo('all tests');
  });
});
