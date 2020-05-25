import fetch from 'isomorphic-unfetch';
import { createLoggedInGraphqlFetch, setupDatabase } from './helpers';
import { USER_TOKEN } from './seeds/users';
import { SimplePaymentProvider } from './seeds/payments';
import { SimpleOrder, SimplePosition, SimplePayment } from './seeds/orders';
import { SimpleProduct } from './seeds/products';
import {
  receiptData,
  transactionIdentifier,
  productIdInAppleAppstoreConnext,
} from './seeds/apple-iap-receipt';

let connection;
let db;
let graphqlFetch;

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

  describe('Apple Store Server Notifications', () => {
    it('notification_type = CANCEL', async () => {
      const params = {
        auto_renew_adam_id: 1000,
        auto_renew_product_id: '',
        auto_renew_status: true,
        auto_renew_status_change_date: new Date(),
        environment: 'Sandbox',
        expiration_intent: '',
        notification_type: 'CANCEL',
        password: '73b61776e7304f8ab1c2404df9192078',
        unified_receipt: {
          latest_receipt_info: [
            {
              original_transaction_id: transactionIdentifier,
            },
          ],
          status: 0,
        },
        bid: '',
        bvrs: '',
      };
      const result = await fetch('http://localhost:3000/graphql/apple-iap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      expect(result.status).toBe(200);

      const order = await db
        .collection('orders')
        .findOne({ _id: 'datatrans-order' });
      expect(order.status).toBe(null);
    });
  });
});
