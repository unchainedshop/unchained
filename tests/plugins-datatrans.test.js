import fetch from 'isomorphic-unfetch';
import { URLSearchParams } from 'url';
import { createLoggedInGraphqlFetch, setupDatabase } from './helpers';
import { USER_TOKEN, User } from './seeds/users';
import { SimplePaymentProvider } from './seeds/payments';
import { SimpleOrder, SimplePosition, SimplePayment } from './seeds/orders';

let db;
let graphqlFetch;

describe('Plugins: Datatrans Payments', () => {
  const merchantId = '1100004624';
  const amount = '20000';
  const currency = 'CHF';
  const refno = 'datatrans-payment';
  const refno2 = 'datatrans-payment2';

  beforeAll(async () => {
    [db] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(USER_TOKEN);

    // Add a datatrans provider
    await db.collection('payment-providers').findOrInsertOne({
      ...SimplePaymentProvider,
      _id: 'datatrans-payment-provider',
      adapterKey: 'shop.unchained.datatrans',
      type: 'GENERIC',
      configuration: [{ key: 'merchantId', value: merchantId }],
    });

    // Add a demo order ready to checkout
    await db.collection('order_payments').findOrInsertOne({
      ...SimplePayment,
      _id: 'datatrans-payment',
      paymentProviderId: 'datatrans-payment-provider',
      orderId: 'datatrans-order',
    });

    await db.collection('order_positions').findOrInsertOne({
      ...SimplePosition,
      _id: 'datatrans-order-position',
      orderId: 'datatrans-order',
    });

    await db.collection('orders').findOrInsertOne({
      ...SimpleOrder,
      _id: 'datatrans-order',
      orderNumber: 'datatrans',
      paymentId: 'datatrans-payment',
    });

    // Add a second demo order ready to checkout
    await db.collection('order_payments').findOrInsertOne({
      ...SimplePayment,
      _id: 'datatrans-payment2',
      paymentProviderId: 'datatrans-payment-provider',
      orderId: 'datatrans-order2',
    });

    await db.collection('order_positions').findOrInsertOne({
      ...SimplePosition,
      _id: 'datatrans-order-position2',
      orderId: 'datatrans-order2',
    });

    await db.collection('orders').findOrInsertOne({
      ...SimpleOrder,
      _id: 'datatrans-order2',
      orderNumber: 'datatrans2',
      paymentId: 'datatrans-payment2',
    });
  });

  describe('Mutation.signPaymentProviderForCredentialRegistration (Datatrans)', () => {
    const sign =
      '0c83ed74918d05cdd5309389dd8f011881250351f861619fbdfb9f75c711a5db';

    it('request a new signed nonce', async () => {
      const { data: { signPaymentProviderForCredentialRegistration } = {} } =
        await graphqlFetch({
          query: /* GraphQL */ `
            mutation signPaymentProviderForCredentialRegistration(
              $paymentProviderId: ID!
            ) {
              signPaymentProviderForCredentialRegistration(
                paymentProviderId: $paymentProviderId
              )
            }
          `,
          variables: {
            paymentProviderId: 'datatrans-payment-provider',
          },
        });

      expect(signPaymentProviderForCredentialRegistration).toBe(sign);
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

  describe('mutation.signPaymentProviderForCheckout (Datatrans) should', () => {
    const sign =
      'a71685e18e4f89f40be55bb959f02534fa5d72e9fc951a16b6cecd3ecbf7b9ec';

    it('request a new signed nonce', async () => {
      const {
        data: { signPaymentProviderForCheckout },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation signPaymentProviderForCheckout(
            $transactionContext: JSON
            $orderPaymentId: ID!
          ) {
            signPaymentProviderForCheckout(
              transactionContext: $transactionContext
              orderPaymentId: $orderPaymentId
            )
          }
        `,
        variables: {
          orderPaymentId: 'datatrans-payment',
          transactionContext: {},
        },
      });

      expect(signPaymentProviderForCheckout).toBe(sign);
    });
  });

  describe('OrderPaymentGeneric.sign (Datatrans)', () => {
    const sign =
      'a71685e18e4f89f40be55bb959f02534fa5d72e9fc951a16b6cecd3ecbf7b9ec';

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
      expect(me?.cart?.payment?.sign).toBe(sign);
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
      const sign =
        'a71685e18e4f89f40be55bb959f02534fa5d72e9fc951a16b6cecd3ecbf7b9ec';

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
      expect(result.status).toBe(500);

      const order = await db
        .collection('orders')
        .findOne({ _id: 'datatrans-order' });
      expect(order.status).toBe(null);

      const orderPayment = await db
        .collection('order_payments')
        .findOne({ _id: refno });

      expect(orderPayment.status).toBe(null);
    });

    it('mocks ingress successful payment webhook call', async () => {
      const sign =
        'a71685e18e4f89f40be55bb959f02534fa5d72e9fc951a16b6cecd3ecbf7b9ec';
      const sign2 =
        '4312a9476bd68d12eb1ca14fb39f6805532b18631c6a47423322555b0c16595f';

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
        .findOne({ _id: 'datatrans-order' });
      expect(order.status).toBe('CONFIRMED');

      const orderPayment = await db
        .collection('order_payments')
        .findOne({ _id: refno });
      expect(orderPayment.status).toBe('PAID');
    });

    it('mocks ingress successful payment webhook call with alias', async () => {
      const sign =
        '0c7d34445860ef18bcf28c72b3013c14b35a23352656b18694a9fcd0a1222523';
      const sign2 =
        '49b61ca73da761a291bb178893b937b0b3286b500646e5a9781b33781e67235e';

      const params = new URLSearchParams();

      params.append('skipSimulation', 'true');
      params.append('maskedCC', '510000xxxxxx0008');
      params.append('sign', sign);
      params.append('sign2', sign2);
      params.append('errorCode', '1403');
      params.append('aliasCC', '17124632626363307');
      params.append('mode', 'lightbox');
      params.append('expy', '21');
      params.append('merchantId', merchantId);
      params.append('uppTransactionId', '200404221602871223');
      params.append('reqtype', 'CAA');
      params.append('errorDetail', 'Declined');
      params.append('currency', currency);
      params.append('theme', 'DT2015');
      params.append('expm', '12');
      params.append('refno', refno2);
      params.append('amount', amount);
      params.append('errorMessage', 'declined');
      params.append('pmethod', 'ECA');
      params.append('acqErrorCode', '50');
      params.append('testOnly', 'yes');
      params.append('status', 'success');
      params.append('useAlias', 'yes');
      params.append('authorizationCode', '650981237');
      params.append('responseCode', '01');
      params.append('acqAuthorizationCode', '221650');
      params.append('responseMessage', 'Authorized');

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
        .findOne({ _id: 'datatrans-order2' });
      expect(order.status).toBe('CONFIRMED');

      const orderPayment = await db
        .collection('order_payments')
        .findOne({ _id: refno2 });
      expect(orderPayment.status).toBe('PAID');
    });

    it('mocks ingress successful payment webhook call with register', async () => {
      const sign =
        '813ffac5be3753f363f82818f9cc0993f4ee421aef351d30b5ca9dc3773dfc24';
      const sign2 =
        '68f22b815c96ee81d3ab7a28ea77253904b0b9738e4bed5ac70a0a00a1168788';

      const paymentProviderId = 'datatrans-payment-provider';
      const registerAmount = 0;
      const registerRefno = `${paymentProviderId}:${User._id}`;

      const params = new URLSearchParams();

      params.append('skipSimulation', 'true');
      params.append('maskedCC', '510000xxxxxx0008');
      params.append('sign', sign);
      params.append('sign2', sign2);
      params.append('errorCode', '1403');
      params.append('aliasCC', '17124632626363307');
      params.append('mode', 'lightbox');
      params.append('expy', '21');
      params.append('merchantId', merchantId);
      params.append('uppTransactionId', '200404221602871223');
      params.append('reqtype', 'CAA');
      params.append('errorDetail', 'Declined');
      params.append('currency', currency);
      params.append('theme', 'DT2015');
      params.append('expm', '12');
      params.append('refno', registerRefno);
      params.append('amount', registerAmount);
      params.append('errorMessage', 'declined');
      params.append('pmethod', 'ECA');
      params.append('acqErrorCode', '50');
      params.append('testOnly', 'yes');
      params.append('status', 'success');
      params.append('useAlias', 'yes');
      params.append('authorizationCode', '650981237');
      params.append('responseCode', '01');
      params.append('acqAuthorizationCode', '221650');
      params.append('responseMessage', 'Authorized');

      const result = await fetch('http://localhost:3000/graphql/datatrans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
        body: params,
      });
      expect(result.status).toBe(200);

      const paymentCredential = await db
        .collection('payment_credentials')
        .findOne({ paymentProviderId });

      expect(paymentCredential).not.toBe(null);
    });
  });
  describe('Checkout', () => {
    it('checkout with stored alias', async () => {
      const { data: { me } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          query {
            me {
              paymentCredentials {
                _id
                user {
                  _id
                }
                paymentProvider {
                  _id
                }
                token
                isValid
                isPreferred
              }
            }
          }
        `,
      });

      expect(me?.paymentCredentials?.[0]).toMatchObject({
        isPreferred: true,
        isValid: true,
        token: expect.anything(),
        paymentProvider: { _id: 'datatrans-payment-provider' },
        user: { _id: 'user' },
      });

      const credentials = me?.paymentCredentials?.[0];
      credentials.meta = {
        currency: 'CHF',
        expm: '12',
        expy: '21',
        maskedCC: '510000xxxxxx0008',
        pmethod: 'ECA',
      };

      const { data: { addCartProduct, updateCart, checkoutCart } = {} } =
        await graphqlFetch({
          query: /* GraphQL */ `
            mutation addAndCheckout($productId: ID!, $paymentContext: JSON) {
              addCartProduct(productId: $productId) {
                _id
              }
              updateCart(paymentProviderId: "datatrans-payment-provider") {
                _id
                status
              }
              checkoutCart(paymentContext: $paymentContext) {
                _id
                status
              }
            }
          `,
          variables: {
            productId: 'simpleproduct',
            paymentContext: {
              paymentCredentials: credentials,
            },
          },
        });
      expect(addCartProduct).toMatchObject(expect.anything());
      expect(updateCart).toMatchObject({
        status: 'OPEN',
      });
      expect(checkoutCart).toMatchObject({
        status: 'CONFIRMED',
      });
    });
    it('checkout with preferred alias', async () => {
      const { data: { addCartProduct, updateCart, checkoutCart } = {} } =
        await graphqlFetch({
          query: /* GraphQL */ `
            mutation addAndCheckout($productId: ID!) {
              addCartProduct(productId: $productId) {
                _id
              }
              updateCart(paymentProviderId: "datatrans-payment-provider") {
                _id
                status
              }
              checkoutCart {
                _id
                status
              }
            }
          `,
          variables: {
            productId: 'simpleproduct',
          },
        });
      expect(addCartProduct).toMatchObject(expect.anything());
      expect(updateCart).toMatchObject({
        status: 'OPEN',
      });
      expect(checkoutCart).toMatchObject({
        status: 'CONFIRMED',
      });
    });
  });
});
