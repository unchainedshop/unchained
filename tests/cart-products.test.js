import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';
import { SimpleProduct } from './seeds/products.js';
import { ConfirmedOrder, SimplePosition } from './seeds/orders.js';

let graphqlFetch;

describe('Cart: Product Items', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch();
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
            addCartProduct(productId: $productId, quantity: $quantity, configuration: $configuration) {
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
              unitPrice {
                currency
                amount
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
          amount: 1499,
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

    it('add another product to the cart (with different config) should create new order item', async () => {
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

    it('return not found error when passed non existing productId', async () => {
      const { errors } = await graphqlFetch({
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
          productId: 'non-existin-id',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('ProductNotFoundError');
    });

    it('return error when passed invalid productId', async () => {
      const { errors } = await graphqlFetch({
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
          productId: '',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
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

    it('return error if order is not mutable (confirmed)', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation emptyCart($orderId: ID!) {
            emptyCart(orderId: $orderId) {
              _id
              items {
                _id
              }
            }
          }
        `,
        variables: {
          orderId: ConfirmedOrder._id,
        },
      });

      expect(errors[0]?.extensions?.code).toEqual('OrderWrongStatusError');
    });
  });

  describe('Mutation.addMultipleCartProducts', () => {
    it('add multiple products to the cart', async () => {
      const { data: { addMultipleCartProducts } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addMultipleCartProducts($items: [OrderItemInput!]!) {
            addMultipleCartProducts(items: $items) {
              _id
              items {
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
      expect(addMultipleCartProducts.items.pop()).toMatchObject({
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
          mutation updateCartItem($itemId: ID!, $configuration: [ProductConfigurationParameterInput!]) {
            updateCartItem(itemId: $itemId, quantity: 10, configuration: $configuration) {
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

    it('return error when passed invalid itemId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCartItem($itemId: ID!, $configuration: [ProductConfigurationParameterInput!]) {
            updateCartItem(itemId: $itemId, quantity: 10, configuration: $configuration) {
              _id
            }
          }
        `,
        variables: {
          itemId: '',
          configuration: [
            {
              key: 'height',
              value: '5',
            },
          ],
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });

    it('return not found error when passed non existing itemId', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCartItem($itemId: ID!, $configuration: [ProductConfigurationParameterInput!]) {
            updateCartItem(itemId: $itemId, quantity: 10, configuration: $configuration) {
              _id
            }
          }
        `,
        variables: {
          itemId: 'non-existing',
          configuration: [
            {
              key: 'height',
              value: '5',
            },
          ],
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('OrderItemNotFoundError');
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

    it('return not found error when passed non existing itemId', async () => {
      const { errors } = await graphqlFetch({
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
          itemId: 'non-existing-id',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('OrderItemNotFoundError');
    });

    it('return error when passed invalid itemId', async () => {
      const { errors } = await graphqlFetch({
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
          itemId: '',
        },
      });
      expect(errors[0]?.extensions?.code).toEqual('InvalidIdError');
    });
  });
});
