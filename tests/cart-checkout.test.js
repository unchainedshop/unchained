import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { SimpleProduct } from './seeds/products';

let connection;
// eslint-disable-next-line no-unused-vars
let db;
let graphqlFetch;

describe('Cart Checkout Flow', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
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
        `
      });
      expect(createCart).toMatchObject({
        orderNumber: 'wishlist'
      });
    });
  });

  describe('Mutation.addCartProduct', () => {
    it('add a product to the cart', async () => {
      const { data: { addCartProduct } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addCartProduct(
            $productId: ID!
            $quantity: Int
            $configuration: [ProductConfigurationParameterInput!]
          ) {
            addCartProduct(
              productId: $productId
              quantity: $quantity
              configuration: $configuration
            ) {
              _id
              quantity
              total {
                currency
                amount
              }
              taxes: total(category: TAX) {
                currency
                amount
              }
              product {
                _id
              }
              order {
                _id
              }
              configuration {
                key
                value
              }
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          quantity: 2,
          configuration: [{ key: 'length', value: '5' }]
        }
      });
      expect(addCartProduct).toMatchObject({
        quantity: 2,
        total: {
          currency: 'CHF',
          amount: 20000
        },
        taxes: {
          amount: 1430
        },
        product: {
          _id: SimpleProduct._id
        },
        order: {},
        configuration: [
          {
            key: 'length'
          }
        ]
      });
    });

    it('add another product to the cart should create new order item', async () => {
      const { data: { addCartProduct } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addCartProduct($productId: ID!) {
            addCartProduct(productId: $productId) {
              _id
              quantity
              order {
                _id
              }
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id
        }
      });
      expect(addCartProduct).toMatchObject({
        quantity: 1
      });
    });
  });

  describe('Mutation.emptyCart', () => {
    it('clear the cart from items', async () => {
      const { data: { emptyCart } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            emptyCart {
              _id
              items {
                _id
              }
            }
          }
        `
      });
      expect(emptyCart).toMatchObject({
        items: []
      });
    });
  });

  describe('Mutation.addMultipleCartProducts', () => {
    it('add multiple products to the cart', async () => {
      const { data: { addMultipleCartProducts } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addMultipleCartProducts($items: [OrderItemInput!]!) {
            addMultipleCartProducts(items: $items) {
              _id
              quantity
              product {
                _id
              }
              configuration {
                key
                value
              }
            }
          }
        `,
        variables: {
          items: [
            {
              productId: SimpleProduct._id,
              quantity: 2,
              configuration: [{ key: 'height', value: '5' }]
            },
            {
              productId: SimpleProduct._id,
              quantity: 2,
              configuration: [{ key: 'height', value: '5' }]
            }
          ]
        }
      });
      expect(addMultipleCartProducts.pop()).toMatchObject({
        quantity: 4,
        product: {
          _id: SimpleProduct._id
        },
        configuration: [
          {
            key: 'height'
          }
        ]
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
            city: 'Zürich'
          }
        }
      });
      expect(updateCart).toMatchObject({
        billingAddress: {
          firstName: 'Hallo'
        }
      });
    });

    it('update the contact', async () => {
      const Orders = db.collection('orders');
      const order = Orders.findOne({ orderNumber: 'wishlist' });
      const { data: { updateCart } = {} } = await graphqlFetch({
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
              meta
            }
          }
        `,
        variables: {
          orderId: order._id,
          contact: {
            emailAddress: 'hello@unchained.shop',
            telNumber: '+41999999999'
          },
          meta: {
            hi: 'there'
          }
        }
      });
      expect(updateCart).toMatchObject({
        contact: {
          emailAddress: 'hello@unchained.shop',
          telNumber: '+41999999999'
        },
        meta: {
          hi: 'there'
        }
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
          orderId: order._id
        }
      });

      expect(checkoutCart).toMatchObject({
        orderNumber: 'wishlist',
        status: 'CONFIRMED'
      });
    });
  });
});
