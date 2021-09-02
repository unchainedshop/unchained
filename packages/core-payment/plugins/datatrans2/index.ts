import {
  PaymentDirector,
  PaymentAdapter,
  PaymentError,
} from 'meteor/unchained:core-payment';
import { createLogger } from 'meteor/unchained:core-logger';
import roundedAmountFromOrder from './roundedAmountFromOrder';
import createDatatransAPI from './api';
import parseRegistrationData from './parseRegistrationData';
import './middleware';

import type {
  ResponseError,
  InitResponseSuccess,
  ValidateResponseSuccess,
  StatusResponseSuccess,
  AuthorizeResponseSuccess,
} from './api/types';

const logger = createLogger('unchained:core-payment:datatrans2');

// v2
const {
  DATATRANS_SECRET,
  DATATRANS_SIGN_KEY,
  DATATRANS_API_ENDPOINT = 'https://api.sandbox.datatrans.com',
} = process.env;

const throwIfResponseError = (result) => {
  if ((result as ResponseError).error) {
    const rawError = (result as ResponseError).error;
    const error = new Error(rawError.message);
    error.name = `DATATRANS_${rawError.code}`;
    throw error;
  }
};
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

  settleInUnchained() {
    return this.config.reduce((current, item) => {
      if (item.key === 'settleInUnchained') return Boolean(item.value);
      return current;
    }, true);
  }

  getMarketplaceSplits(): {
    subMerchantId: string;
    amount: number;
    comission: number;
  }[] {
    return this.config.flatMap((item) => {
      if (item.key === 'marketplaceSplit') {
        const [subMerchantId, amount, comission] = item.value
          .split(';')
          .map((f) => f.trim());
        return [
          {
            subMerchantId,
            amount: parseInt(amount, 10),
            comission: parseInt(comission, 10),
          },
        ];
      }
      return [];
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

    if (useSecureFields) {
      const result = await this.api.secureFields({
        ...additionalInitPayload,
        currency: price.currency || 'CHF',
        refno,
        refno2,
        customer: {
          id: userId,
        },
        amount: price.amount,
      });
      throwIfResponseError(result);
      return JSON.stringify(result as InitResponseSuccess);
    }
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
    throwIfResponseError(result);
    return JSON.stringify(result as InitResponseSuccess);
  }

  async validate(token) {
    const { objectKey, currency } = this.context.meta;
    const result = await this.api.validate({
      refno: `valid-${new Date().getTime()}`,
      currency,
      [objectKey]: JSON.parse(token),
    });
    logger.info(`Datatrans Plugin: Validation Result`, result);
    return (result as ValidateResponseSuccess)?.transactionId;
  }

  async register(transactionResponse) {
    const { transactionId } = transactionResponse;

    const status = (await this.api.status({
      transactionId,
    })) as StatusResponseSuccess;
    if (status.transactionId) {
      return parseRegistrationData(status);
    }
    logger.info('Datatrans Plugin: Registration declined', transactionResponse);
    return null;
  }

  async authorize({ paymentCredentials, extensions }): Promise<string> {
    const splits = this.getMarketplaceSplits();
    const { order, userId } = this.context;
    const orderPayment = order.payment();
    const refno = orderPayment._id;
    const refno2 = userId;
    const { currency, amount } = roundedAmountFromOrder(order);
    const result = await this.api.authorize({
      ...extensions,
      amount,
      currency,
      refno,
      refno2,
      autoSettle: false,
      customer: {
        id: userId,
      },
      marketplace: splits.length
        ? {
            splits,
          }
        : undefined,
      [paymentCredentials.meta.objectKey]: JSON.parse(paymentCredentials.token),
    });
    throwIfResponseError(result);
    return (result as AuthorizeResponseSuccess).transactionId;
  }

  isTransactionAmountValid(transaction: StatusResponseSuccess): boolean {
    const { order } = this.context;
    const { currency, amount } = roundedAmountFromOrder(order);
    if (
      transaction.currency !== currency ||
      (transaction.detail.authorize as any)?.amount !== amount
    ) {
      return false;
    }
    return true;
  }

  async settle({ transactionId, refno, refno2, extensions }): Promise<boolean> {
    const splits = this.getMarketplaceSplits();
    const { order } = this.context;
    const { currency, amount } = roundedAmountFromOrder(order);
    const result = await this.api.settle({
      transactionId,
      amount,
      refno,
      refno2,
      currency,
      marketplace: splits.length
        ? {
            splits,
          }
        : undefined,
      extensions,
    });
    throwIfResponseError(result);
    return result as boolean;
  }

  async cancel({ transactionId, refno }): Promise<boolean> {
    const result = await this.api.cancel({
      transactionId,
      refno,
    });
    if (!result) {
      logger.info(`Datatrans Plugin: Canceling failed`, result);
      return false;
    }
    return true;
  }

  async charge({
    transactionId: rawTransactionId,
    paymentCredentials,
    ...extensions
  }) {
    if (!rawTransactionId && !paymentCredentials) {
      logger.info(
        'Datatrans Plugin: Not trying to charge because of missing payment authorization response, return false to provide later'
      );
      return false;
    }

    const transactionId =
      rawTransactionId ||
      (await this.authorize({
        paymentCredentials,
        extensions,
      }));

    const transaction: StatusResponseSuccess = (await this.api.status({
      transactionId,
    })) as StatusResponseSuccess;
    const status = transaction?.status;

    if (!status) {
      logger.info(
        `Datatrans Plugin: Transaction declined / Transaction ID ${transactionId} not found`
      );
      throw new Error('Transaction not found');
    }

    if (status === 'canceled' || status === 'failed') {
      logger.info(
        `Datatrans Plugin: Transaction declined / Transaction ID ${transactionId} has invalid status`
      );
      throw new Error('Payment canceled/failed');
    }

    if (status === 'authenticated') {
      logger.info(
        `Datatrans Plugin: Transaction declined / Transaction ID ${transactionId} not authorized yet`
      );
      throw new Error('Payment not authorized');
    }

    if (status === 'authorized') {
      // either settle or cancel
      try {
        if (!this.isTransactionAmountValid(transaction)) {
          logger.info(
            `Datatrans Plugin: Transaction declined / Transaction ID ${transactionId} because of amount/currency mismatch`
          );
          throw new Error('Amount / Currency Mismatch with Cart');
        }
        if (this.settleInUnchained()) {
          // if further deferred settlement is active, don't settle in unchained and hand off
          // settlement to other systems
          await this.settle({
            transactionId,
            refno: transaction.refno,
            refno2: transaction.refno2,
            extensions,
          });
        }
      } catch (e) {
        await this.cancel({
          transactionId,
          refno: transaction.refno,
        });
        throw e;
      }
    }

    if (status === 'authorized' || status === 'settled') {
      let settledTransaction = transaction;
      let credentials;
      // here we try to guard us against a potential
      // network hicup or registration data parsing error
      // at the dumbest possible moment
      try {
        credentials = parseRegistrationData(settledTransaction);
        const result = await this.api.status({
          transactionId,
        });
        if ((result as ResponseError)?.error) {
          settledTransaction = transaction;
        } else {
          settledTransaction = result as StatusResponseSuccess;
        }
      } catch (e) {
        logger.error(
          `Datatrans Plugin: Existing Transaction could not be retrieved with ID ${transactionId}`
        );
      }
      return {
        settledTransaction,
        extensions,
        credentials,
      };
    }

    if (
      status === 'initialized' ||
      status === 'challenge_required' ||
      status === 'challenge_ongoing' ||
      status === 'transmitted'
    ) {
      logger.info(`Datatrans Plugin: Transaction in transit`);
      return false;
    }

    throw new Error('BLUB');
  }
}

PaymentDirector.registerAdapter(Datatrans);
