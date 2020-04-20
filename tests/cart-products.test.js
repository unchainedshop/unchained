import { setupDatabase, createLoggedInGraphqlFetch } from './helpers';
import { SimpleProduct } from './seeds/products';
import { SimplePosition } from './seeds/orders';

let connection;
// eslint-disable-next-line no-unused-vars
let db;
let graphqlFetch;

describe('Cart: Product Items', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch();
  });

  afterAll(async () => {
    await connection.close();
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
          configuration: [{ key: 'length', value: '5' }],
        },
      });
      expect(addCartProduct).toMatchObject({
        quantity: 2,
        total: {
          currency: 'CHF',
          amount: 20000,
        },
        taxes: {
          amount: 1430,
        },
        product: {
          _id: SimpleProduct._id,
        },
        order: {},
        configuration: [
          {
            key: 'length',
          },
        ],
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
          productId: SimpleProduct._id,
        },
      });
      expect(addCartProduct).toMatchObject({
        quantity: 1,
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
        `,
      });
      expect(emptyCart).toMatchObject({
        items: [],
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
              configuration: [{ key: 'height', value: '5' }],
            },
            {
              productId: SimpleProduct._id,
              quantity: 2,
              configuration: [{ key: 'height', value: '5' }],
            },
          ],
        },
      });
      expect(addMultipleCartProducts.pop()).toMatchObject({
        quantity: 4,
        product: {
          _id: SimpleProduct._id,
        },
        configuration: [
          {
            key: 'height',
          },
        ],
      });
    });
  });

  describe('Mutation.updateCartItem', () => {
    it('update a cart item', async () => {
      const { data: { updateCartItem } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCartItem(
            $itemId: ID!
            $configuration: [ProductConfigurationParameterInput!]
          ) {
            updateCartItem(
              itemId: $itemId
              quantity: 10
              configuration: $configuration
            ) {
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
          itemId: SimplePosition._id,
          configuration: [
            {
              key: 'height',
              value: '5',
            },
          ],
        },
      });
      expect(updateCartItem).toMatchObject({
        _id: SimplePosition._id,
        quantity: 10,
        product: {
          _id: SimpleProduct._id,
        },
        configuration: [
          {
            key: 'height',
            value: '5',
          },
        ],
      });
    });
  });

  describe('Mutation.removeCartItem', () => {
    it('remove a cart item', async () => {
      const { data: { removeCartItem } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation removeCartItem($itemId: ID!) {
            removeCartItem(itemId: $itemId) {
              _id
              product {
                _id
              }
            }
          }
        `,
        variables: {
          itemId: SimplePosition._id,
        },
      });
      expect(removeCartItem).toMatchObject({
        _id: SimplePosition._id,
        product: {
          _id: SimpleProduct._id,
        },
      });
    });
  });
});
