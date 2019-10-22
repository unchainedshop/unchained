import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError
} from 'meteor/unchained:core-payment';
import { OrderPayments } from 'meteor/unchained:core-orders';
import { WebApp } from 'meteor/webapp';
import bodyParser from 'body-parser';
import crypto from 'crypto';

const {
  DATATRANS_SECRET,
  DATATRANS_SIGN_KEY,
  DATATRANS_WEBHOOK_PATH = '/graphql/datatrans'
} = process.env;

const getSecretkey = () => DATATRANS_SECRET;
const getSignKey = () => DATATRANS_SIGN_KEY;

const generateSignature = (...parts) => {
  // https://docs.datatrans.ch/docs/security-sign
  const resultString = parts.filter(Boolean).join('');
  const signKeyInBytes = Buffer.from(getSignKey(), 'hex');
  const signedString = crypto
    .createHmac('sha256', signKeyInBytes)
    .update(resultString)
    .digest('hex');
  return signedString;
};

WebApp.connectHandlers.use(
  DATATRANS_WEBHOOK_PATH,
  bodyParser.urlencoded({ extended: false })
);

WebApp.connectHandlers.use('/graphql/datatrans', (req, res) => {
  if (req.method === 'POST') {
    const authorizationResponse = req.body || {};
    const { refno } = authorizationResponse;
    if (refno) {
      try {
        const orderPayment = OrderPayments.findOne({ _id: refno });
        const order = orderPayment.order();
        order.checkout({ paymentContext: authorizationResponse });
      } catch (e) {
        console.error(e);
      }
    }
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

  configurationError() { // eslint-disable-line
    if (!this.getMerchantId() || !getSecretkey() || !getSignKey()) {
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
    const { aliasCC = '' } = transactionContext;
    const merchantId = this.getMerchantId();

    const { orderPayment } = this.context;
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
        refno
      })} with ${signature}`
    );
    return signature;
  }

  async charge(transactionResponse) {
    const {
      aliasCC,
      status,
      uppTransactionId,
      sign,
      sign2
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
        return transactionResponse;
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
