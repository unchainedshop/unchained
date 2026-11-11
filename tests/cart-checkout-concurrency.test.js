import test from 'node:test';
import assert from 'node:assert';
import { setupDatabase, createLoggedInGraphqlFetch, disconnect } from './helpers.js';
import { ADMIN_TOKEN, USER_TOKEN } from './seeds/users.js';

test.describe('Cart checkout concurrency', () => {
  let db;
  let graphqlFetch;
  let adminGraphqlFetch;

  test.before(async () => {
    [db] = await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(USER_TOKEN);
    adminGraphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);

    const { errors } = await adminGraphqlFetch({
      query: /* GraphQL */ `
        mutation {
          updateProductCommerce(
            productId: "tokenized-product"
            commerce: {
              pricing: [
                {
                  amount: 5000
                  currencyCode: "CHF"
                  countryCode: "CH"
                  isTaxable: true
                  isNetPrice: false
                }
              ]
            }
          ) {
            _id
          }
          publishProduct(productId: "tokenized-product") {
            _id
          }
        }
      `,
    });
    assert.strictEqual(errors, undefined, JSON.stringify(errors));
  });

  test.after(async () => {
    await disconnect();
  });

  const prepareCart = async (orderNumber) => {
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
    const orderId = createCart._id;

    const { data: { addCartProduct } = {} } = await graphqlFetch({
      query: /* GraphQL */ `
        mutation addCartProduct($orderId: ID!) {
          addCartProduct(orderId: $orderId, productId: "tokenized-product", quantity: 1) {
            _id
          }
        }
      `,
      variables: { orderId },
    });

    await graphqlFetch({
      query: /* GraphQL */ `
        mutation updateCart($orderId: ID!) {
          updateCart(
            orderId: $orderId
            billingAddress: {
              firstName: "Con"
              lastName: "Current"
              addressLine: "Teststrasse 1"
              postalCode: "8000"
              city: "Zurich"
              countryCode: "CH"
            }
            contact: { emailAddress: "user@unchained.local" }
            paymentProviderId: "simple-payment-provider"
            deliveryProviderId: "simple-delivery-provider"
          ) {
            _id
          }
        }
      `,
      variables: { orderId },
    });

    return { orderId, positionId: addCartProduct._id };
  };

  const checkout = (orderId) =>
    graphqlFetch({
      query: /* GraphQL */ `
        mutation checkoutCart($orderId: ID!) {
          checkoutCart(orderId: $orderId) {
            _id
            status
          }
        }
      `,
      variables: { orderId },
    });

  test('a single checkout tokenizes the ordered quantity once', async () => {
    const { orderId, positionId } = await prepareCart('concurrency-control');

    const { data, errors } = await checkout(orderId);
    assert.strictEqual(errors, undefined, JSON.stringify(errors));
    assert.strictEqual(data.checkoutCart.status, 'CONFIRMED');

    const tokens = await db
      .collection('token_surrogates')
      .countDocuments({ orderPositionId: positionId });
    assert.strictEqual(tokens, 1);
  });

  test('parallel checkouts of one cart process the order only once', async () => {
    const { orderId, positionId } = await prepareCart('concurrency-race');

    const results = await Promise.all(Array.from({ length: 6 }, () => checkout(orderId)));

    // Every caller gets the same confirmed order, nobody gets an error.
    results.forEach(({ data, errors }) => {
      assert.strictEqual(errors, undefined, JSON.stringify(errors));
      assert.strictEqual(data.checkoutCart._id, orderId);
      assert.strictEqual(data.checkoutCart.status, 'CONFIRMED');
    });

    const tokens = await db
      .collection('token_surrogates')
      .find({ orderPositionId: positionId })
      .toArray();
    assert.strictEqual(tokens.length, 1);

    const order = await db.collection('orders').findOne({ _id: orderId });
    const checkoutLogEntries = order.log.filter(({ status }) => status === 'CONFIRMED');
    assert.strictEqual(checkoutLogEntries.length, 1);
  });

  const preparePendingOrder = async (orderNumber) => {
    const cart = await prepareCart(orderNumber);
    await db
      .collection('orders')
      .updateOne({ _id: cart.orderId }, { $set: { status: 'PENDING', ordered: new Date() } });
    return cart;
  };

  const processPendingOrder = (mutation, orderId) =>
    adminGraphqlFetch({
      query: /* GraphQL */ `
        mutation ${mutation}($orderId: ID!) {
          ${mutation}(orderId: $orderId) {
            _id
            status
          }
        }
      `,
      variables: { orderId },
    });

  test('concurrent confirmations of a pending order tokenize once', async () => {
    const { orderId, positionId } = await preparePendingOrder('confirm-race');

    const results = await Promise.all([
      processPendingOrder('confirmOrder', orderId),
      processPendingOrder('confirmOrder', orderId),
    ]);
    results.forEach(({ errors }) => assert.strictEqual(errors, undefined, JSON.stringify(errors)));

    const tokens = await db
      .collection('token_surrogates')
      .countDocuments({ orderPositionId: positionId });
    assert.strictEqual(tokens, 1);
  });

  test('a confirmation racing a rejection leaves the order in one state', async () => {
    const { orderId, positionId } = await preparePendingOrder('confirm-reject-race');

    await Promise.all([
      processPendingOrder('confirmOrder', orderId),
      processPendingOrder('rejectOrder', orderId),
    ]);

    const order = await db.collection('orders').findOne({ _id: orderId });
    const tokens = await db
      .collection('token_surrogates')
      .countDocuments({ orderPositionId: positionId });
    assert.strictEqual(tokens, order.status === 'CONFIRMED' ? 1 : 0, order.status);
  });

  test('a payment racing a confirmation tokenizes a pending order once', async () => {
    const { orderId, positionId } = await preparePendingOrder('pay-confirm-race');

    const results = await Promise.all([
      processPendingOrder('payOrder', orderId),
      processPendingOrder('confirmOrder', orderId),
    ]);
    results.forEach(({ errors }) => assert.strictEqual(errors, undefined, JSON.stringify(errors)));

    const tokens = await db
      .collection('token_surrogates')
      .countDocuments({ orderPositionId: positionId });
    assert.strictEqual(tokens, 1);
  });
});
