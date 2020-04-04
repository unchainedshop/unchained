import fetch from 'isomorphic-unfetch';
import { URLSearchParams } from 'url';
import { createLoggedInGraphqlFetch, setupDatabase } from './helpers';
import { USER_TOKEN } from './seeds/users';
import { SimplePaymentProvider } from './seeds/payments';
import { SimpleOrder, SimplePayment } from './seeds/orders';

let connection;
let db; // eslint-disable-line
let graphqlFetch;

describe('Plugins: Datatrans Payments', () => {
  const merchantId = '1100004624';
  const amount = '20000';
  const currency = 'CHF';
  const refno = 'datatrans-payment';
  const sign =
    'a71685e18e4f89f40be55bb959f02534fa5d72e9fc951a16b6cecd3ecbf7b9ec';
  const sign2 =
    '4312a9476bd68d12eb1ca14fb39f6805532b18631c6a47423322555b0c16595f';

  beforeAll(async () => {
    [db, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(USER_TOKEN);
    await db.collection('payment-providers').findOrInsertOne({
      ...SimplePaymentProvider,
      _id: 'datatrans-payment-provider',
      adapterKey: 'shop.unchained.datatrans',
      type: 'GENERIC',
      configuration: [{ key: 'merchantId', value: merchantId }],
    });

    await db.collection('order_payments').findOrInsertOne({
      ...SimplePayment,
      _id: 'datatrans-payment',
      paymentProviderId: 'datatrans-payment-provider',
      orderId: SimpleOrder._id,
    });

    await db.collection('orders').updateOne(
      { _id: SimpleOrder._id },
      {
        $set: {
          orderNumber: 'datatrans',
          paymentId: 'datatrans-payment',
        },
      }
    );
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
          transactionContext: {},
        },
      });

      expect(me.cart.payment.sign).toBe(sign);
    });
    it('datatrans accepts the parameters for a payment form', async () => {
      // https://pay.sandbox.datatrans.com/upp/jsp/upStart.jsp?merchantId=1100004624&refno=datatrans&amount=100000&currency=CHF&sign=c3b752995f529d73d38edc0b682d0dd2007540f151c9c892a9c0966948599f72
      const url = `https://pay.sandbox.datatrans.com/upp/jsp/upStart.jsp?merchantId=${merchantId}&refno=${refno}&amount=${amount}&currency=${currency}&sign=${sign}&useAlias=1`;
      const result = await fetch(url);
      const text = await result.text();
      expect(text).not.toMatch(/incorrect request/);
      expect(text).not.toMatch(/error/);
    });
  });

  describe('Datatrans Hooks', () => {
    it('mocks ingress declined payment webhook call', async () => {
      const params = new URLSearchParams();
      params.append('uppMsgType', 'post');
      params.append('status', 'error');
      params.append('uppTransactionId', '180710160458378622');
      params.append('refno', refno);
      params.append('amount', amount);
      params.append('errorMessage', 'declined');
      params.append('sign', sign);
      params.append('errorCode', '1403');
      params.append('language', 'en');
      params.append('pmethod', 'VIS');
      params.append('merchantId', merchantId);
      params.append('reqtype', 'CAA');
      params.append('errorDetail', 'Declined');
      params.append('currency', currency);
      params.append('acqErrorCode', '50');
      params.append('testOnly', 'yes');
      params.append('expm', '12');
      params.append('expy', '18');
      const result = await fetch('http://localhost:3000/graphql/datatrans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        body: params,
      });
      expect(result.status).toBe(200);

      const order = await db
        .collection('orders')
        .findOne({ _id: SimpleOrder._id });
      expect(order.status).toBe(null);

      const orderPayment = await db
        .collection('order_payments')
        .findOne({ _id: refno });
      expect(orderPayment.status).toBe(null);
    });

    it('mocks ingress successful payment webhook call', async () => {
      const params = new URLSearchParams();
      params.append('uppMsgType', 'post');
      params.append('status', 'success');
      params.append('uppTransactionId', '180710155247074969');
      params.append('refno', refno);
      params.append('amount', amount);
      params.append('authorizationCode', '258235030');
      params.append('sign', sign);
      params.append('sign2', sign2);
      params.append('language', 'en');
      params.append('pmethod', 'VIS');
      params.append('responseCode', '01');
      params.append('acqAuthorizationCode', '155258');
      params.append('merchantId', merchantId);
      params.append('reqtype', 'CAA');
      params.append('currency', currency);
      params.append('responseMessage', 'Authorized');
      params.append('testOnly', 'yes');
      params.append('expm', '12');
      params.append('expy', '18');
      const result = await fetch('http://localhost:3000/graphql/datatrans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        body: params,
      });
      expect(result.status).toBe(200);

      const order = await db
        .collection('orders')
        .findOne({ _id: SimpleOrder._id });
      expect(order.status).toBe('CONFIRMED');

      const orderPayment = await db
        .collection('order_payments')
        .findOne({ _id: refno });
      expect(orderPayment.status).toBe('PAID');
    });
  });
});
