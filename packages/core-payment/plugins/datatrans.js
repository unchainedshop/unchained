import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError
} from 'meteor/unchained:core-payment';
import { WebApp } from 'meteor/webapp';

const bodyParser = require('body-parser');

const { DATATRANS_SECRET } = process.env;

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
  static key = 'com.datatrans';

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

  configurationError() { // eslint-disable-line
    if (!this.getMerchantId() || !this.getSecretkey()) {
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

  async sign(transactionData) {
    const bla = '';
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
