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
    it('starts a new transaction and checks if it is valid', async () => {
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

      const { location, transactionId } = JSON.parse(
        signPaymentProviderForCredentialRegistration,
      );

      const url = `https://pay.sandbox.datatrans.com/v1/start/${transactionId}`;
      expect(location).toBe(url);

      const result = await fetch(url);
      const text = await result.text();
      expect(text).not.toMatch(/incorrect request/);
      expect(text).not.toMatch(/error/);
    });
  });

  describe('mutation.signPaymentProviderForCheckout (Datatrans) should', () => {
    it('starts a new transaction and checks if it is valid', async () => {
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

      const { location, transactionId } = JSON.parse(
        signPaymentProviderForCheckout,
      );

      const url = `https://pay.sandbox.datatrans.com/v1/start/${transactionId}`;
      expect(location).toBe(url);

      const result = await fetch(url);
      const text = await result.text();
      expect(text).not.toMatch(/incorrect request/);
      expect(text).not.toMatch(/error/);
    });
  });

  describe('Datatrans Hooks', () => {
    it.only('mocks ingress accepted card_check webhook call', async () => {
      const result = await fetch(
        'http://localhost:3000/payment/datatrans/webhook',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'datatrans-signature':
              't=12424123412,s0=c4834800ca758bcd93c7ac639d1debc9dec1cadad60b00a6ba0afbc2466d1553',
          },
          body: `{"card":{"3D":{"authenticationResponse":"D"},"alias":"70119122433810042","expiryMonth":"12","expiryYear":"21","info":{"brand":"VISA CREDIT","country":"GB","issuer":"DATATRANS","type":"credit","usage":"consumer"},"masked":"424242xxxxxx4242"},"currency":"CHF","detail":{"authorize":{"acquirerAuthorizationCode":"100055"}},"history":[{"action":"init","date":"2021-09-03T08:00:32Z","ip":"212.232.234.26","source":"api","success":true},{"action":"authorize","date":"2021-09-03T08:00:55Z","ip":"212.232.234.26","source":"redirect","success":true}],"language":"de","paymentMethod":"VIS","refno":"${refno}","refno2":"${User._id}","status":"authorized","transactionId":"210903100032246655","type":"card_check"}`,
        },
      );

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
          'Content-Type': 'application/json; charset=utf-8',
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
          'Content-Type': 'application/json; charset=utf-8',
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
          'Content-Type': 'application/json; charset=utf-8',
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
                meta
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
        meta: {
          currency: 'CHF',
          expm: '12',
          expy: '21',
          maskedCC: '510000xxxxxx0008',
          pmethod: 'ECA',
        },
        token: expect.anything(),
        paymentProvider: { _id: 'datatrans-payment-provider' },
        user: { _id: 'user' },
      });

      const credentials = me?.paymentCredentials?.[0];

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
