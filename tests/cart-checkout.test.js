import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { SimpleProduct } from './seeds/products';

let connection;
let db;
let graphqlFetch;

describe('cart checkout', () => {
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
});
