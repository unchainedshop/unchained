import fetch from 'isomorphic-unfetch';
import { URLSearchParams } from 'url';
import { createLoggedInGraphqlFetch, setupDatabase } from './helpers';
import { USER_TOKEN } from './seeds/users';
import { SimplePaymentProvider } from './seeds/payments';
import { SimpleOrder, SimplePayment } from './seeds/orders';

let connection;
let db; // eslint-disable-line
let graphqlFetch;

describe('cart checkout', () => {
  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(USER_TOKEN);
    await db.collection('payment-providers').findOrInsertOne({
      ...SimplePaymentProvider,
      _id: 'datatrans-payment-provider',
      adapterKey: 'shop.unchained.datatrans',
      type: 'GENERIC',
      configuration: [{ key: 'merchantId', value: '1100004624' }]
    });

    await db.collection('order_payments').findOrInsertOne({
      ...SimplePayment,
      _id: 'datatrans-payment',
      paymentProviderId: 'datatrans-payment-provider',
      orderId: 'datatrans-order'
    });

    await db.collection('orders').findOrInsertOne({
      ...SimpleOrder,
      _id: 'datatrans-order',
      orderNumber: 'datatrans',
      paymentId: 'datatrans-payment'
    });
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('OrderPaymentGeneric.sign (Datatrans)', () => {
    it('request a new signed nonce', async () => {
      const { data: { me } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query sign($transactionContext: JSON, $orderNumber: String) {
            me {
              cart(orderNumber: $orderNumber) {
                _id
                payment {
                  _id
                  ... on OrderPaymentGeneric {
                    sign(transactionContext: $transactionContext)
                  }
                }
              }
            }
          }
        `,
        variables: {
          orderNumber: 'datatrans',
          transactionContext: {}
        }
      });
      expect(me.cart.payment.sign).toBe(
        'c3b752995f529d73d38edc0b682d0dd2007540f151c9c892a9c0966948599f72'
      );
    });
    it('datatrans accepts the parameters for a payment form', async () => {
      const merchantId = '1100004624';
      const amount = '100000';
      const currency = 'CHF';
      const refno = 'datatrans';
      const sign =
        'c3b752995f529d73d38edc0b682d0dd2007540f151c9c892a9c0966948599f72';
      const url = `https://pay.sandbox.datatrans.com/upp/jsp/upStart.jsp?merchantId=${merchantId}&refno=${refno}&amount=${amount}&currency=${currency}&sign=${sign}`;
      const result = await fetch(url);
      const text = await result.text();
      expect(text).not.toMatch(/incorrect request/);
      expect(text).not.toMatch(/error/);
    });
  });

  describe('Datatrans Hooks', () => {
    it('mocks ingress successful payment webhook call', async () => {
      const params = new URLSearchParams();
      params.append('uppMsgType', 'post');
      params.append('status', 'success');
      params.append('uppTransactionId', '180710155247074969');
      params.append('refno', '735821');
      params.append('amount', '1000');
      params.append('authorizationCode', '258235030');
      params.append('sign', '30916165706580013');
      params.append('language', 'en');
      params.append('pmethod', 'VIS');
      params.append('responseCode', '01');
      params.append('expy', '18');
      params.append('acqAuthorizationCode', '155258');
      params.append('merchantId', '1000011011');
      params.append('reqtype', 'CAA');
      params.append('currency', 'CHF');
      params.append('responseMessage', 'Authorized');
      params.append('testOnly', 'yes');
      params.append('expm', '12');
      const result = await fetch('http://localhost:3000/graphql/datatrans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
        },
        body: params
      });
      expect(result.status).toBe(200);
    });

    it('mocks ingress declined payment webhook call', async () => {
      const params = new URLSearchParams();
      params.append('uppMsgType', 'post');
      params.append('status', 'error');
      params.append('uppTransactionId', '180710160458378622');
      params.append('refno', '497184');
      params.append('amount', '1000');
      params.append('errorMessage', 'declined');
      params.append('sign', '30916165706580013');
      params.append('errorCode', '1403');
      params.append('language', 'en');
      params.append('pmethod', 'VIS');
      params.append('expy', '18');
      params.append('merchantId', '1000011011');
      params.append('reqtype', 'CAA');
      params.append('errorDetail', 'Declined');
      params.append('currency', 'CHF');
      params.append('acqErrorCode', '50');
      params.append('testOnly', 'yes');
      params.append('expm', '12');
      const result = await fetch('http://localhost:3000/graphql/datatrans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
        },
        body: params
      });
      expect(result.status).toBe(200);
    });
  });
});
