import { createLoggedInGraphqlFetch, setupDatabase } from './helpers';
import { USER_TOKEN } from './seeds/users';
import { SimplePaymentProvider } from './seeds/payments';
import { SimpleOrder, SimplePosition, SimplePayment } from './seeds/orders';
import { SimpleProduct } from './seeds/products';

let connection;
let db;
let graphqlFetch;

const receiptData = `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`;

const transactionIdentifier = '1000000663102276';

const productIdInAppleAppstoreConnext = 'MmGRN8pPGxghn6rTJ';

describe('Plugins: Apple IAP Payments', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(USER_TOKEN);

    await db.collection('products').findOrInsertOne({
      ...SimpleProduct,
      _id: productIdInAppleAppstoreConnext,
    });

    // Add a iap provider
    await db.collection('payment-providers').findOrInsertOne({
      ...SimplePaymentProvider,
      _id: 'iap-payment-provider',
      adapterKey: 'shop.unchained.apple-iap',
      type: 'GENERIC',
    });

    // Add a demo order ready to checkout
    await db.collection('order_payments').findOrInsertOne({
      ...SimplePayment,
      _id: 'iap-payment',
      paymentProviderId: 'iap-payment-provider',
      orderId: 'iap-order',
    });

    await db.collection('order_positions').findOrInsertOne({
      ...SimplePosition,
      _id: 'iap-order-position',
      orderId: 'iap-order',
      quantity: 1,
      productId: productIdInAppleAppstoreConnext,
    });

    await db.collection('orders').findOrInsertOne({
      ...SimpleOrder,
      _id: 'iap-order',
      orderNumber: 'iap',
      paymentId: 'iap-payment',
    });

    // Add a second demo order ready to checkout
    await db.collection('order_payments').findOrInsertOne({
      ...SimplePayment,
      _id: 'iap-payment2',
      paymentProviderId: 'iap-payment-provider',
      orderId: 'iap-order2',
    });

    await db.collection('order_positions').findOrInsertOne({
      ...SimplePosition,
      _id: 'iap-order-position2',
      orderId: 'iap-order2',
      quantity: 1,
      productId: productIdInAppleAppstoreConnext,
    });

    await db.collection('orders').findOrInsertOne({
      ...SimpleOrder,
      _id: 'iap-order2',
      orderNumber: 'iap2',
      paymentId: 'iap-payment2',
    });
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Mutation.registerPaymentCredentials (Apple IAP)', () => {
    it('store the receipt as payment credentials', async () => {
      const { data: { registerPaymentCredentials } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation registerPaymentCredentials(
            $paymentContext: JSON!
            $paymentProviderId: ID!
          ) {
            registerPaymentCredentials(
              paymentContext: $paymentContext
              paymentProviderId: $paymentProviderId
            ) {
              _id
              isValid
              isPreferred
            }
          }
        `,
        variables: {
          paymentContext: {
            receiptData,
          },
          paymentProviderId: 'iap-payment-provider',
        },
      });
      expect(registerPaymentCredentials).toMatchObject({
        isValid: true,
        isPreferred: true,
      });
    });
    it('checkout with stored receipt in credentials', async () => {
      const {
        data: { updateOrderPaymentGeneric, checkoutCart } = {},
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation checkout($orderId: ID!, $orderPaymentId: ID!, $meta: JSON) {
            updateOrderPaymentGeneric(
              orderPaymentId: $orderPaymentId
              meta: $meta
            ) {
              _id
              status
            }
            checkoutCart(orderId: $orderId) {
              _id
              status
            }
          }
        `,
        variables: {
          orderPaymentId: 'iap-payment',
          orderId: 'iap-order',
          meta: {
            transactionIdentifier,
          },
        },
      });
      expect(updateOrderPaymentGeneric).toMatchObject({
        status: 'OPEN',
      });
      expect(checkoutCart).toMatchObject({
        status: 'CONFIRMED',
      });
    });
    it('checking out again with the same transaction should fail', async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation checkout(
            $paymentContext: JSON
            $paymentProviderId: ID!
            $productId: ID!
          ) {
            emptyCart {
              _id
            }
            addCartProduct(productId: $productId) {
              _id
            }
            updateCart(paymentProviderId: $paymentProviderId) {
              _id
            }
            checkoutCart(paymentContext: $paymentContext) {
              _id
              status
            }
          }
        `,
        variables: {
          paymentProviderId: 'iap-payment-provider',
          productId: productIdInAppleAppstoreConnext,
          paymentContext: {
            receiptData,
            meta: { transactionIdentifier },
          },
        },
      });
      expect(errors[0].extensions.code).toEqual('OrderCheckoutError');
    });
  });
});
