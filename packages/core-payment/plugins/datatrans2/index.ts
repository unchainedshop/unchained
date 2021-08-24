import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError,
  PaymentCredentials,
} from 'meteor/unchained:core-payment';
import { OrderPayments } from 'meteor/unchained:core-orders';
import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import bodyParser from 'body-parser';
import { createLogger } from 'meteor/unchained:core-logger';
import generateSignature, { Security } from './generateSignature';
import roundedAmountFromOrder from './roundedAmountFromOrder';
import createDatatransAPI from './api';

import type { ResponseError, InitResponseSuccess } from './api/types';

const logger = createLogger('unchained:core-payment:datatrans2');

// v2
const {
  DATATRANS_SECRET,
  DATATRANS_SIGN_KEY,
  DATATRANS_SIGN2_KEY,
  DATATRANS_SECURITY = Security.DYNAMIC_SIGN,
  DATATRANS_API_ENDPOINT = 'https://api.sandbox.datatrans.com',
  DATATRANS_WEBHOOK_PATH = '/graphql/datatrans',
} = process.env;

useMiddlewareWithCurrentContext(
  DATATRANS_WEBHOOK_PATH,
  bodyParser.urlencoded({ extended: false })
);

useMiddlewareWithCurrentContext(DATATRANS_WEBHOOK_PATH, async (req, res) => {
  if (req.method === 'POST') {
    const authorizationResponse = req.body || {};
    const { refno, amount } = authorizationResponse;
    if (refno) {
      try {
        if (amount === '0') {
          const [paymentProviderId, userId] = refno.split(':');
          const paymentCredentials =
            PaymentCredentials.registerPaymentCredentials({
              paymentProviderId,
              paymentContext: authorizationResponse,
              userId,
            });
          logger.info(
            `Datatrans Webhook: Unchained registered payment credentials for ${userId}`,
            { userId }
          );
          res.writeHead(200);
          res.end(JSON.stringify(paymentCredentials));
          return;
        }
        const orderPayment = OrderPayments.findOne({ _id: refno });
        const order = await orderPayment
          .order()
          .checkout({ paymentContext: authorizationResponse });
        res.writeHead(200);
        logger.info(
          `Datatrans Webhook: Unchained confirmed checkout for order ${order.orderNumber}`,
          { orderId: order._id }
        );
        res.end(JSON.stringify(order));
        return;
      } catch (e) {
        logger.error(
          `Datatrans Webhook: Unchained rejected to checkout with message ${JSON.stringify(
            e
          )}`
        );
        res.writeHead(500);
        res.end(JSON.stringify(e));
        return;
      }
    } else {
      logger.error(`Datatrans Webhook: Reference number not set`);
    }
  }
  res.writeHead(404);
  res.end();
});

class Datatrans extends PaymentAdapter {
  static key = 'shop.unchained.datatrans';

  static label = 'Datatrans Modern (https://docs.datatrans.ch)';

  static version = '2.0.0';

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

  configurationError() {
    if (!this.getMerchantId() || !DATATRANS_SECRET || !DATATRANS_SIGN_KEY) {
      return PaymentError.INCOMPLETE_CONFIGURATION;
    }
    return null;
  }

  isActive() {
    if (this.configurationError() === null) return true;
    return false;
  }

  // eslint-disable-next-line
  isPayLaterAllowed() {
    return false;
  }

  get api() {
    if (!DATATRANS_SECRET) throw new Error('Credentials not Set');
    return createDatatransAPI(
      DATATRANS_API_ENDPOINT,
      this.getMerchantId(),
      DATATRANS_SECRET
    );
  }

  async sign({ transactionContext } = {}) {
    const { useSecureFields = false, ...additionalInitPayload } =
      transactionContext || {};

    const { orderPayment, paymentProviderId, userId } = this.context;
    const order = orderPayment?.order();
    const refno = orderPayment ? orderPayment._id : paymentProviderId;
    const refno2 = userId;

    const price: { amount?: number; currency?: string } = order
      ? roundedAmountFromOrder(order)
      : {};
    const result = await this.api.init({
      ...additionalInitPayload,
      currency: price.currency || 'CHF',
      refno,
      refno2,
      customer: {
        id: userId,
      },
      amount: price.amount,
    });
    if ((result as InitResponseSuccess).transactionId) {
      return JSON.stringify(result);
    }
    const rawError = (result as ResponseError).error;
    const error = new Error(rawError.message);
    error.name = `DATATRANS_${rawError.code}`;
    throw error;
  }

  async validate(token) {
    const result = await authorize({
      endpoint: DATATRANS_API_ENDPOINT,
      secret: DATATRANS_SECRET,
      merchantId: this.getMerchantId(),
      refno: `validate-${new Date().toLocaleString()}`,
      amount: 0,
      aliasCC: token,
      ...this.context.meta,
    });
    logger.info(`Datatrans Plugin: Validation Result`, result);
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
      const validSign = generateSignature({
        security: DATATRANS_SECURITY,
        signKey: DATATRANS_SIGN_KEY,
      })(
        aliasCC,
        merchantId,
        '0', // amount 0
        currency,
        refno
      );
      const validSign2 = generateSignature({
        security: DATATRANS_SECURITY,
        signKey: DATATRANS_SIGN2_KEY || DATATRANS_SIGN_KEY,
      })(
        aliasCC,
        merchantId,
        '0', // amount 0
        currency,
        uppTransactionId
      );
      if (sign === validSign && sign2 === validSign2) {
        logger.info(
          'Datatrans Plugin: Registered successfully',
          transactionResponse
        );
        return {
          token: aliasCC,
          expy,
          expm,
          pmethod,
          currency,
          maskedCC,
        };
      }
      logger.info(
        `Datatrans Plugin: Somebody evil attempted to trick us, fix ${sign} === ${validSign}, ${sign2} === ${validSign2}`,
        transactionResponse
      );
    }
    logger.info('Datatrans Plugin: Registration declined', transactionResponse);
    return null;
  }

  async chargeWithCredentials(paymentCredentials) {
    const merchantId = this.getMerchantId();
    const { order } = this.context;
    const refno = order.paymentId;
    const { currency, amount } = roundedAmountFromOrder(order);
    const aliasCC = paymentCredentials.token;

    const result = await authorize({
      endpoint: DATATRANS_API_ENDPOINT,
      secret: DATATRANS_SECRET,
      ...paymentCredentials.meta,
      merchantId,
      refno,
      amount,
      currency,
      aliasCC,
    });
    const response =
      result?.authorizationService?.body?.[0]?.transaction?.[0]?.response?.[0];
    if (!response || response.status?.[0] !== 'success') {
      logger.info(
        'Datatrans Plugin: Payment declined from authorization service',
        result
      );
      throw new Error('Payment declined');
    }

    const convertedResponse = Object.fromEntries(
      Object.entries(response).map(([key, values]) => {
        return [key, values?.[0]];
      })
    );
    return {
      ...paymentCredentials.meta,
      merchantId,
      refno,
      amount,
      currency,
      aliasCC,
      ...convertedResponse,
    };
  }

  async charge(payload) {
    if (!payload) {
      logger.info(
        'Datatrans Plugin: Not trying to charge because of missing payment authorization response, return false to provide later'
      );
      return false;
    }
    const ignoreSignatureCheck = !!payload.paymentCredentials;
    const transactionResponse = payload.paymentCredentials
      ? await this.chargeWithCredentials(payload.paymentCredentials)
      : payload;

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
    const { currency, amount } = roundedAmountFromOrder(order);

    if (!status || status === 'error') {
      logger.info('Datatrans Plugin: Payment declined', transactionResponse);
      throw new Error('Payment declined');
    }
    const validSign = generateSignature({
      security: DATATRANS_SECURITY,
      signKey: DATATRANS_SIGN_KEY,
    })(aliasCC, merchantId, amount, currency, refno);
    const validSign2 = generateSignature({
      security: DATATRANS_SECURITY,
      signKey: DATATRANS_SIGN2_KEY || DATATRANS_SIGN_KEY,
    })(aliasCC, merchantId, amount, currency, uppTransactionId);
    if (DATATRANS_SECURITY.toLowerCase() !== Security.DYNAMIC_SIGN) {
      if (
        amount !== transactionResponse.amount ||
        currency !== transactionResponse.currency
      ) {
        logger.info(
          `Datatrans Plugin: Somebody (evil?) attempted to charge the wrong amount`,
          transactionResponse
        );
        throw new Error('Signature mismatch');
      }
    }
    if (
      (sign === validSign &&
        ((!sign2 && validSign2 === validSign) || sign2 === validSign2)) ||
      ignoreSignatureCheck
    ) {
      logger.info(
        'Datatrans Plugin: Charged successfully',
        transactionResponse
      );
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
    logger.info(
      `Datatrans Plugin: Somebody (evil?) used the wrong signature when checking out, fix ${sign} === ${validSign}, ${sign2} === ${validSign2}`,
      transactionResponse
    );
    throw new Error('Signature mismatch');
  }
}

PaymentDirector.registerAdapter(Datatrans);
