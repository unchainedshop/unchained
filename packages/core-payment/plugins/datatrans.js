import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError
} from 'meteor/unchained:core-payment';
import { WebApp } from 'meteor/webapp';

import bodyParser from 'body-parser';
import crypto from 'crypto';

const { DATATRANS_SECRET, DATATRANS_SIGN_KEY } = process.env;

WebApp.connectHandlers.use(
  '/graphql/datatrans',
  bodyParser.urlencoded({ extended: false })
);

WebApp.connectHandlers.use('/graphql/datatrans', (req, res) => {
  if (req.method === 'POST') {
    const {
      uppMsgType,
      status,
      uppTransactionId,
      refno,
      amount,
      authorizationCode,
      sign,
      language,
      pmethod,
      responseCode,
      expy,
      acqAuthorizationCode,
      merchantId,
      reqtype,
      currency,
      responseMessage,
      testOnly,
      expm
    } = req.body || {};
    return res.end();
  }
  return res.end();
});

class Datatrans extends PaymentAdapter {
  static key = 'shop.unchained.datatrans';

  static label = 'Datatrans';

  static version = '1.0';

  static initialConfiguration = [
    {
      key: 'merchantId',
      value: null
    }
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

  getSecretkey() { // eslint-disable-line
    return DATATRANS_SECRET;
  }

  getSignKey() { // eslint-disable-line
    return DATATRANS_SIGN_KEY;
  }

  configurationError() { // eslint-disable-line
    if (!this.getMerchantId() || !this.getSecretkey() || !this.signKey()) {
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

  async sign({ transactionContext }) {
    const { orderPayment } = this.context;
    const order = orderPayment.order();
    const { aliasCC = '', refno = orderPayment._id } = transactionContext;
    const merchantId = this.getMerchantId();
    const { currency, amount } = order.pricing().total();

    // https://docs.datatrans.ch/docs/security-sign
    const resultString = `${aliasCC}${merchantId}${amount}${currency}${refno}`;
    this.log(`Datatrans -> Sign ${resultString}`);
    const signKeyInHex = this.getSignKey();
    const signKeyInBytes = Buffer.from(signKeyInHex, 'hex');
    const signedString = crypto
      .createHmac('sha256', signKeyInBytes)
      .update(resultString)
      .digest('hex');
    return signedString;
  }

  async charge({ datatransToken, datatransCustomerId } = {}) {
    return false;
    // if (!datatransToken)
    //   throw new Error('You have to provide datatransToken in paymentContext');
    // const DatatransAPI = require('datatrans'); // eslint-disable-line
    // const datatrans = DatatransAPI(this.getSecretkey());
    // const pricing = this.context.order.pricing();
    // const datatransChargeReceipt = await datatrans.charges.create({
    //   amount: Math.round(pricing.total().amount),
    //   currency: this.context.order.currency.toLowerCase(),
    //   description: `${EMAIL_WEBSITE_NAME} Order #${this.context.order._id}`,
    //   source: datatransToken.id,
    //   customer: datatransCustomerId
    // });
    // this.log('Datatrans -> ', datatransToken, datatransChargeReceipt);
    // return datatransChargeReceipt;
  }
}

PaymentDirector.registerAdapter(Datatrans);
