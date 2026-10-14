import { OrderPricingSheet, PaymentDirector } from '@unchainedshop/core';
import { ordersSettings } from '@unchainedshop/core-orders';
import { createLoggedInGraphqlFetch, disconnect, setupDatabase } from './helpers.js';
import { getTestPlatform } from './setup.js';
import { SimpleProduct } from './seeds/products.js';
import assert from 'node:assert';
import test from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';

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

    const createChargeableCart = async (orderNumber, quantity) => {
      const { data: { createCart } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createCart($orderNumber: String!) {
            createCart(orderNumber: $orderNumber) {
              _id
            }
          }
        `,
        variables: { orderNumber },
      });
      const { data: { addCartProduct } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation addCartProduct($productId: ID!, $quantity: Int, $orderId: ID) {
            addCartProduct(productId: $productId, quantity: $quantity, orderId: $orderId) {
              _id
            }
          }
        `,
        variables: { productId: SimpleProduct._id, quantity, orderId: createCart._id },
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
      return { cartId: createCart._id, itemId: addCartProduct._id };
    };

    const checkoutCart = (orderId) =>
      graphqlFetch({
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
        variables: { orderId },
      });

    const updateCartItem = (itemId, quantity) =>
      graphqlFetch({
        query: /* GraphQL */ `
          mutation updateCartItem($itemId: ID!, $quantity: Int) {
            updateCartItem(itemId: $itemId, quantity: $quantity) {
              quantity
            }
          }
        `,
        variables: { itemId, quantity },
      });

    const holdCharges = (t) => {
      const charges = [];
      const { promise: charging, resolve: chargingStarted } = Promise.withResolvers();
      const { promise: paid, resolve: pay } = Promise.withResolvers();
      const chargeOrderPayment = PaymentDirector.chargeOrderPayment;
      t.mock.method(PaymentDirector, 'chargeOrderPayment', async (order, ...args) => {
        charges.push(
          OrderPricingSheet({ calculation: order.calculation, currencyCode: order.currencyCode }).total()
            .amount,
        );
        chargingStarted();
        await paid;
        return chargeOrderPayment(order, ...args);
      });
      return { charges, charging, pay };
    };

    test('keeps the cart unchanged while it is being charged', async (t) => {
      const { cartId, itemId } = await createChargeableCart('charging', 1);
      const { charges, charging, pay } = holdCharges(t);

      const checkout = checkoutCart(cartId);
      await charging;
      const [update, secondCheckout] = await Promise.all([
        updateCartItem(itemId, 10),
        checkoutCart(cartId),
      ]);
      pay();
      const { data } = await checkout;

      assert.strictEqual(update.errors?.[0]?.extensions?.code, 'OrderLockedError');
      assert.strictEqual(secondCheckout.errors?.[0]?.extensions?.code, 'OrderLockedError');
      assert.partialDeepStrictEqual(data.checkoutCart, {
        status: 'CONFIRMED',
        items: [{ quantity: 1 }],
        total: { amount: charges[0] },
      });
    });

    test('keeps a cart mutation exclusive beyond its lease', async (t) => {
      const { cartId, itemId } = await createChargeableCart('slow-mutation', 1);
      const { modules } = getTestPlatform().unchainedAPI;
      const acquireLock = modules.orders.acquireLock;
      t.mock.method(modules.orders, 'acquireLock', (orderId, identifier, ttl) =>
        acquireLock(orderId, identifier, orderId === cartId ? 300 : ttl),
      );
      const { promise: validating, resolve: validationStarted } = Promise.withResolvers();
      const { promise: resumed, resolve: resume } = Promise.withResolvers();
      const validateOrderPosition = ordersSettings.validateOrderPosition;
      t.mock.method(ordersSettings, 'validateOrderPosition', async (params, ...args) => {
        if (params.order._id === cartId && params.quantityDiff === 9) {
          validationStarted();
          await resumed;
        }
        return validateOrderPosition(params, ...args);
      });
      const { charges, charging, pay } = holdCharges(t);

      const update = updateCartItem(itemId, 10);
      await validating;
      await sleep(600);
      const checkout = checkoutCart(cartId);
      await Promise.race([charging, sleep(300)]);
      resume();
      const { errors } = await update;
      pay();
      const { data } = await checkout;

      assert.strictEqual(errors, undefined);
      assert.partialDeepStrictEqual(data.checkoutCart, {
        status: 'CONFIRMED',
        items: [{ quantity: 10 }],
        total: { amount: charges[0] },
      });
    });

    test('validates a cart item change against the item under the lock', async (t) => {
      const { cartId, itemId } = await createChargeableCart('stale-item', 5);
      const { modules } = getTestPlatform().unchainedAPI;
      const acquireLock = modules.orders.acquireLock;
      const { promise: waiting, resolve: wait } = Promise.withResolvers();
      const { promise: proceeding, resolve: proceed } = Promise.withResolvers();
      t.mock.method(modules.orders, 'acquireLock', async (orderId, ...args) => {
        if (orderId === cartId) {
          wait();
          await proceeding;
        }
        return acquireLock(orderId, ...args);
      });
      const quantityDiffs = [];
      const validateOrderPosition = ordersSettings.validateOrderPosition;
      t.mock.method(ordersSettings, 'validateOrderPosition', async (params, ...args) => {
        quantityDiffs.push(params.quantityDiff);
        return validateOrderPosition(params, ...args);
      });

      const update = updateCartItem(itemId, 6);
      await waiting;
      await modules.orders.positions.updateProductItem({
        orderPositionId: itemId,
        quantity: 1,
        configuration: null,
      });
      proceed();
      const { errors } = await update;

      assert.strictEqual(errors, undefined);
      assert.deepStrictEqual(quantityDiffs, [5]);
    });
  });
});
