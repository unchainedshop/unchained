import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { PlanProduct } from './seeds/products';

let connection;
// eslint-disable-next-line no-unused-vars
let db;
let graphqlFetch;

describe('Subscriptions', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.createCart (Subscription)', () => {
    it('create a cart with a specific order number', async () => {
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
          status: 'ACTIVE',
        },
      });
    });
  });
});
