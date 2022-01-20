import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { SimpleProduct } from './seeds/products';

let db;
let graphqlFetch;

describe('Cart Checkout Flow', () => {
  beforeAll(async () => {
    [db] = await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch();
  });

  describe('Mutation.createCart', () => {
    it('create a cart with a specific order number', async () => {
      const { data: { createCart } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            createCart(orderNumber: "wishlist") {
              _id
              orderNumber
            }
          }
        `,
      });
      expect(createCart).toMatchObject({
        orderNumber: 'wishlist',
      });
    });
  });

  describe('Mutation.addCartProduct', () => {
    it('add a product to the cart', async () => {
      const Orders = db.collection('orders');
      const order = Orders.findOne({ orderNumber: 'wishlist' });
      const { data: { addCartProduct } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addCartProduct(
            $productId: ID!
            $quantity: Int
            $orderId: ID
          ) {
            addCartProduct(
              productId: $productId
              quantity: $quantity
              orderId: $orderId
            ) {
              _id
              quantity
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          orderId: order._id,
          quantity: 1,
        },
      });
      expect(addCartProduct).toMatchObject({
        quantity: 1,
      });
    });
  });

  describe('Mutation.updateCart', () => {
    it('update the billingAddress', async () => {
      const Orders = db.collection('orders');
      const order = Orders.findOne({ orderNumber: 'wishlist' });
      const { data: { updateCart } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCart($billingAddress: AddressInput, $orderId: ID) {
            updateCart(orderId: $orderId, billingAddress: $billingAddress) {
              _id
              billingAddress {
                firstName
              }
            }
          }
        `,
        variables: {
          orderId: order._id,
          billingAddress: {
            firstName: 'Hallo',
            lastName: 'Velo',
            addressLine: 'Strasse 1',
            addressLine2: 'Postfach',
            postalCode: '8000',
            city: 'Zürich',
          },
        },
      });
      expect(updateCart).toMatchObject({
        billingAddress: {
          firstName: 'Hallo',
        },
      });
    });

    it('update the contact', async () => {
      const Orders = db.collection('orders');
      const order = Orders.findOne({ orderNumber: 'wishlist' });
      const { data } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCart(
            $meta: JSON
            $contact: ContactInput
            $orderId: ID
          ) {
            updateCart(orderId: $orderId, contact: $contact, meta: $meta) {
              _id
              contact {
                emailAddress
                telNumber
              }
            }
          }
        `,
        variables: {
          orderId: order._id,
          contact: {
            emailAddress: 'hello@unchained.shop',
            telNumber: '+41999999999',
          },
          meta: {
            hi: 'there',
          },
        },
      });
      expect(data?.updateCart).toMatchObject({
        contact: {
          emailAddress: 'hello@unchained.shop',
          telNumber: '+41999999999',
        },
      });
    });
  });

  describe('Mutation.checkoutCart', () => {
    it('checkout the cart with invoice', async () => {
      const Orders = db.collection('orders');
      const order = Orders.findOne({ orderNumber: 'wishlist' });

      const { data: { checkoutCart } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation checkoutCart($orderId: ID) {
            checkoutCart(orderId: $orderId) {
              _id
              orderNumber
              status
            }
          }
        `,
        variables: {
          orderId: order._id,
        },
      });

      expect(checkoutCart).toMatchObject({
        orderNumber: 'wishlist',
        status: 'CONFIRMED',
      });
    });
  });
});
