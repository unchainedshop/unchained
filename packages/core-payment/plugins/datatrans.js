import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError,
  PaymentCredentials,
} from 'meteor/unchained:core-payment';
import { OrderPayments } from 'meteor/unchained:core-orders';
import { WebApp } from 'meteor/webapp';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import fetch from 'isomorphic-unfetch';
import xml2js from 'xml2js';

const {
  DATATRANS_SECRET,
  DATATRANS_SIGN_KEY,
  DATATRANS_API_ENDPOINT = 'https://api.sandbox.datatrans.com',
  DATATRANS_WEBHOOK_PATH = '/graphql/datatrans',
} = process.env;

const generateSignature = (...parts) => {
  // https://docs.datatrans.ch/docs/security-sign
  const resultString = parts.filter(Boolean).join('');
  const signKeyInBytes = Buffer.from(DATATRANS_SIGN_KEY, 'hex');

  const signedString = crypto
    .createHmac('sha256', signKeyInBytes)
    .update(resultString)
    .digest('hex');

  return signedString;
};

const datatransAuthorize = async ({
  merchantId,
  refno,
  amount,
  currency,
  aliasCC,
  expm,
  expy,
  pmethod,
}) => {
  const body = `
<?xml version="1.0" encoding="UTF-8" ?>
<authorizationService version="6">
<body merchantId="${merchantId}">
<transaction refno="${refno}">
<request>
  <amount>${amount}</amount>
  <currency>${currency}</currency>
  <aliasCC>${aliasCC}</aliasCC>
  <pmethod>${pmethod}</pmethod>
  <expm>${expm}</expm>
  <expy>${expy}</expy>
</request>
</transaction>
</body>
</authorizationService>`;
  const result = await fetch(
    `${DATATRANS_API_ENDPOINT}/upp/jsp/XML_authorize.jsp`,
    {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/xml',
        Authorization: `Basic ${DATATRANS_SECRET}`,
      },
    }
  );
  const xml = await result.text();
  return xml2js.parseStringPromise(xml);
};

WebApp.connectHandlers.use(
  DATATRANS_WEBHOOK_PATH,
  bodyParser.urlencoded({ extended: false })
);

WebApp.connectHandlers.use(DATATRANS_WEBHOOK_PATH, (req, res) => {
  if (req.method === 'POST') {
    const authorizationResponse = req.body || {};
    const { refno, status, amount } = authorizationResponse;
    if (refno && status === 'success') {
      try {
        if (amount === '0') {
          const [paymentProviderId, userId] = refno.split(':');
          const paymentCredentials = PaymentCredentials.registerPaymentCredentials(
            {
              paymentProviderId,
              paymentContext: authorizationResponse,
              userId,
            }
          );
          res.writeHead(200);
          return res.end(JSON.stringify(paymentCredentials));
        }
        const orderPayment = OrderPayments.findOne({ _id: refno });
        const order = orderPayment
          .order()
          .checkout({ paymentContext: authorizationResponse });
        res.writeHead(200);
        return res.end(JSON.stringify(order));
      } catch (e) {
        res.writeHead(503);
        console.error(e); // eslint-disable-line
        return res.end(JSON.stringify(e));
      }
    }
  }
  res.writeHead(200);
  return res.end();
});

class Datatrans extends PaymentAdapter {
  static key = 'shop.unchained.datatrans';

  static label = 'Datatrans';

  static version = '1.0';

  static initialConfiguration = [
    {
      key: 'merchantId',
      value: null,
    },
  ];

  static typeSupported(type) {
    return type === 'GENERIC';
  }

  getMerchantId() {
    return this.config.reduce((current, item) => {
      if (item.key === 'merchantId') return item.value;
      return current;
    }, null);
  }

  configurationError() { // eslint-disable-line
    if (!this.getMerchantId() || !DATATRANS_SECRET || !DATATRANS_SIGN_KEY) {
      return PaymentError.INCOMPLETE_CONFIGURATION;
    }
    if (this.wrongCredentials) {
      return PaymentError.WRONG_CREDENTIALS;
    }
    return null;
  }

  isActive() { // eslint-disable-line
    if (this.configurationError() === null) return true;
    return false;
  }

  isPayLaterAllowed() { // eslint-disable-line
    return false;
  }

  async sign({ transactionContext = {} } = {}) {
    const merchantId = this.getMerchantId();

    const { orderPayment } = this.context;
    if (!orderPayment) {
      // sign for registration
      const currency = 'CHF';
      const refno = `${this.context.paymentProviderId}:${this.context.userId}`;
      const amount = '0';
      const aliasCC = '';
      const signature = generateSignature(
        aliasCC,
        merchantId,
        amount,
        currency,
        refno
      );
      this.log(
        `Datatrans -> Signed for Registration ${JSON.stringify({
          aliasCC,
          merchantId,
          amount,
          currency,
          refno,
        })} with ${signature}`
      );
      return signature;
    }
    // sign for order checkout
    const { aliasCC } = transactionContext;
    const order = orderPayment.order();
    const refno = orderPayment._id;
    const { currency, amount } = order.pricing().total();
    const signature = generateSignature(
      aliasCC,
      merchantId,
      amount,
      currency,
      refno
    );
    this.log(
      `Datatrans -> Signed ${JSON.stringify({
        aliasCC,
        merchantId,
        amount,
        currency,
        refno,
      })} with ${signature}`
    );
    return signature;
  }

  async validate(token) {
    const result = await datatransAuthorize({
      merchantId: this.getMerchantId(),
      refno: `validate-${new Date().toLocaleString()}`,
      amount: 0,
      aliasCC: token,
      ...this.context.meta,
    });
    this.log(`Datatrans -> Validation Result`, result);
    return (
      result?.authorizationService?.body?.[0]?.transaction?.[0]?.response?.[0]
        ?.status[0] === 'success'
    );
  }

  async register(transactionResponse) {
    const {
      aliasCC,
      status,
      uppTransactionId,
      sign,
      sign2,
      expy,
      expm,
      pmethod,
      currency,
      refno,
      maskedCC,
    } = transactionResponse;
    const merchantId = this.getMerchantId();
    if (status === 'success') {
      const validSign = generateSignature(
        aliasCC,
        merchantId,
        '0', // amount 0
        currency,
        refno
      );
      const validSign2 = generateSignature(
        aliasCC,
        merchantId,
        '0', // amount 0
        currency,
        uppTransactionId
      );
      if (sign === validSign && sign2 === validSign2) {
        this.log('Datatrans -> Registered successfully', transactionResponse);
        return {
          token: aliasCC,
          expy,
          expm,
          pmethod,
          currency,
          maskedCC,
        };
      }
      this.log(
        `Datatrans -> Somebody evil attempted to trick us, fix ${sign} === ${validSign}, ${sign2} === ${validSign2}`,
        transactionResponse
      );
      throw new Error('Signature mismatch');
    } else if (status === 'error') {
      this.log('Datatrans -> Registration declined', transactionResponse);
      throw new Error('Payment declined');
    } else {
      this.log(
        'Datatrans -> Not trying to charge because of missing payment authorization response'
      );
      return false;
    }
  }

  async charge(transactionResponse) {
    const {
      aliasCC,
      status,
      uppTransactionId,
      sign,
      sign2,
      expy,
      expm,
      pmethod,
      maskedCC,
    } = transactionResponse;
    const merchantId = this.getMerchantId();
    const { order } = this.context;
    const refno = order.paymentId;
    const { currency, amount } = order.pricing().total();
    if (status === 'success') {
      const validSign = generateSignature(
        aliasCC,
        merchantId,
        amount,
        currency,
        refno
      );
      const validSign2 = generateSignature(
        aliasCC,
        merchantId,
        amount,
        currency,
        uppTransactionId
      );
      if (sign === validSign && sign2 === validSign2) {
        this.log('Datatrans -> Charged successfully', transactionResponse);
        return {
          ...transactionResponse,
          credentials: aliasCC && {
            token: aliasCC,
            expy,
            expm,
            pmethod,
            currency,
            maskedCC,
          },
        };
      }
      this.log(
        `Datatrans -> Somebody evil attempted to trick us, fix ${sign} === ${validSign}, ${sign2} === ${validSign2}`,
        transactionResponse
      );
      throw new Error('Signature mismatch');
    } else if (status === 'error') {
      this.log('Datatrans -> Payment declined', transactionResponse);
      throw new Error('Payment declined');
    } else {
      this.log(
        'Datatrans -> Not trying to charge because of missing payment authorization response'
      );
      return false;
    }
  }
}

PaymentDirector.registerAdapter(Datatrans);
