import { OrderPricingSheet, PaymentDirector } from '@unchainedshop/core';
import { createLoggedInGraphqlFetch, disconnect, setupDatabase } from './helpers.js';
import { SimpleProduct } from './seeds/products.js';
import assert from 'node:assert';
import test from 'node:test';

test.describe('Cart Checkout Flow', () => {
  let graphqlFetch;
  let orderId;

  test.before(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch();
  });

  test.after(async () => {
    await disconnect();
  });

  test.describe('Mutation.createCart', () => {
    test('create a cart with a specific order number', async () => {
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
      assert.partialDeepStrictEqual(createCart, {
        orderNumber: 'wishlist',
      });

      orderId = createCart._id;
    });
  });

  test.describe('Mutation.addCartProduct', () => {
    test('add a product to the cart', async () => {
      const { data: { addCartProduct } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addCartProduct($productId: ID!, $quantity: Int, $orderId: ID) {
            addCartProduct(productId: $productId, quantity: $quantity, orderId: $orderId) {
              _id
              quantity
            }
          }
        `,
        variables: {
          productId: SimpleProduct._id,
          orderId,
          quantity: 1,
        },
      });
      assert.partialDeepStrictEqual(addCartProduct, {
        quantity: 1,
      });
    });
  });

  test.describe('Mutation.updateCart', () => {
    test('update the billingAddress', async () => {
      const { data: { updateCart } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCart($billingAddress: AddressInput, $orderId: ID) {
            updateCart(orderId: $orderId, billingAddress: $billingAddress) {
              _id
              billingAddress {
                firstName
                lastName
                postalCode
                city
              }
            }
          }
        `,
        variables: {
          orderId,
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

      assert.partialDeepStrictEqual(updateCart, {
        billingAddress: {
          firstName: 'Hallo',
          lastName: 'Velo',
          postalCode: '8000',
          city: 'Zürich',
        },
      });
    });

    test('update the contact', async () => {
      const { data } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCart($meta: JSON, $contact: ContactInput, $orderId: ID) {
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
          orderId,
          contact: {
            emailAddress: 'hello@unchained.local',
            telNumber: '+41999999999',
          },
          meta: {
            hi: 'there',
          },
        },
      });

      assert.partialDeepStrictEqual(data?.updateCart, {
        contact: {
          emailAddress: 'hello@unchained.local',
          telNumber: '+41999999999',
        },
      });
    });
  });

  test.describe('Mutation.checkoutCart', () => {
    test('checkout the cart with invoice', async () => {
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
          orderId,
        },
      });

      assert.partialDeepStrictEqual(checkoutCart, {
        orderNumber: 'wishlist',
        status: 'CONFIRMED',
      });
    });

    test('return unchained order if trying to checkout the cart with invoice again', async () => {
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
          orderId,
        },
      });

      assert.partialDeepStrictEqual(checkoutCart, {
        orderNumber: 'wishlist',
        status: 'CONFIRMED',
      });
    });

    test('keeps the cart unchanged while it is being charged', async (t) => {
      const { data: { createCart } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            createCart(orderNumber: "charging") {
              _id
            }
          }
        `,
      });
      const { data: { addCartProduct } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addCartProduct($productId: ID!, $orderId: ID) {
            addCartProduct(productId: $productId, quantity: 1, orderId: $orderId) {
              _id
            }
          }
        `,
        variables: { productId: SimpleProduct._id, orderId: createCart._id },
      });
      await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCart($orderId: ID, $billingAddress: AddressInput, $contact: ContactInput) {
            updateCart(orderId: $orderId, billingAddress: $billingAddress, contact: $contact) {
              _id
            }
          }
        `,
        variables: {
          orderId: createCart._id,
          billingAddress: { firstName: 'Ada', lastName: 'Lovelace', postalCode: '8000', city: 'Zürich' },
          contact: { emailAddress: 'hello@unchained.local' },
        },
      });

      const chargeOrderPayment = PaymentDirector.chargeOrderPayment;
      const { promise: charging, resolve: chargingStarted } = Promise.withResolvers();
      const { promise: paid, resolve: pay } = Promise.withResolvers();
      let chargedAmount;
      t.mock.method(PaymentDirector, 'chargeOrderPayment', async (order, ...args) => {
        chargedAmount = OrderPricingSheet({
          calculation: order.calculation,
          currencyCode: order.currencyCode,
        }).total().amount;
        chargingStarted();
        await paid;
        return chargeOrderPayment(order, ...args);
      });

      const checkout = graphqlFetch({
        query: /* GraphQL */ `
          mutation checkoutCart($orderId: ID) {
            checkoutCart(orderId: $orderId) {
              status
              items {
                quantity
              }
              total {
                amount
              }
            }
          }
        `,
        variables: { orderId: createCart._id },
      });
      await charging;
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCartItem($itemId: ID!) {
            updateCartItem(itemId: $itemId, quantity: 10) {
              _id
            }
          }
        `,
        variables: { itemId: addCartProduct._id },
      });
      pay();
      const { data: { checkoutCart } = {} } = await checkout;

      assert.strictEqual(errors?.[0]?.extensions?.code, 'OrderLockedError');
      assert.partialDeepStrictEqual(checkoutCart, {
        status: 'CONFIRMED',
        items: [{ quantity: 1 }],
        total: { amount: chargedAmount },
      });
    });
  });
});
