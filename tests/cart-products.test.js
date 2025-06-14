import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { SimpleProduct } from './seeds/products.js';
import { ConfirmedOrder, SimplePosition } from './seeds/orders.js';
import assert from 'node:assert';
import test from 'node:test';

test.describe('Cart: Product Items', () => {
  let graphqlFetch;

  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.addCartProduct', () => {
    test('add a product to the cart', async () => {
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
                currencyCode
                amount
              }
              taxes: total(category: TAX) {
                currencyCode
                amount
              }
              product {
                _id
              }
              unitPrice {
                currencyCode
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
      assert.partialDeepStrictEqual(addCartProduct, {
        quantity: 2,
        total: {
          currencyCode: 'CHF',
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
            value: '5',
          },
        ],
      });
    });

    test('add another product to the cart (with different config) should create new order item', async () => {
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
      assert.partialDeepStrictEqual(addCartProduct, {
        quantity: 1,
      });
    });

    test('return not found error when passed non existing productId', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'ProductNotFoundError');
    });

    test('return error when passed invalid productId', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });

  test.describe('Mutation.emptyCart', () => {
    test('clear the cart from items', async () => {
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

      assert.partialDeepStrictEqual(emptyCart, {
        items: [],
      });
    });

    test('return error if order is not mutable (confirmed)', async () => {
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

      assert.strictEqual(errors[0]?.extensions?.code, 'OrderWrongStatusError');
    });
  });

  test.describe('Mutation.addMultipleCartProducts', () => {
    test('add multiple products to the cart', async () => {
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
      assert.partialDeepStrictEqual(addMultipleCartProducts.items.pop(), {
        quantity: 4,
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

  test.describe('Mutation.updateCartItem', () => {
    test('update a cart item', async () => {
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
      assert.deepStrictEqual(updateCartItem, {
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

    test('return error when passed invalid itemId', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });

    test('return not found error when passed non existing itemId', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'OrderItemNotFoundError');
    });
  });

  test.describe('Mutation.removeCartItem', () => {
    test('remove a cart item', async () => {
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
      assert.deepStrictEqual(removeCartItem, {
        _id: SimplePosition._id,
        product: {
          _id: SimpleProduct._id,
        },
      });
    });

    test('return not found error when passed non existing itemId', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'OrderItemNotFoundError');
    });

    test('return error when passed invalid itemId', async () => {
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
      assert.strictEqual(errors[0]?.extensions?.code, 'InvalidIdError');
    });
  });
});
