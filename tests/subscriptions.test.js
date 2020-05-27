import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { PlanProduct } from './seeds/products';

let connection;
let graphqlFetch;

describe('Subscriptions', () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.createCart (Subscription)', () => {
    it('checking out a plan product generates a new subscription', async () => {
      const { data: { createCart } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            createCart(orderNumber: "subscriptionCart") {
              _id
              orderNumber
            }
          }
        `,
      });
      const { data: { checkoutCart } = {} } = await graphqlFetch({
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
      const { data: { createSubscription } = {} } = await graphqlFetch({
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
});
