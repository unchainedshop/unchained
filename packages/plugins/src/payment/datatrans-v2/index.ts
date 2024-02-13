import { IPaymentAdapter } from '@unchainedshop/types/payments.js';
import { PaymentAdapter, PaymentError, PaymentDirector } from '@unchainedshop/core-payment';
import { createLogger } from '@unchainedshop/logger';
import { PaymentPricingRowCategory } from '@unchainedshop/types/payments.pricing.js';
import createDatatransAPI from './api/index.js';
import type {
  AuthorizeAuthenticatedResponseSuccess,
  AuthorizeResponseSuccess,
  InitResponseSuccess,
  ResponseError,
  StatusResponseSuccess,
  ValidateResponseSuccess,
} from './api/types.js';
import parseRegistrationData from './parseRegistrationData.js';
import roundedAmountFromOrder from './roundedAmountFromOrder.js';

export * from './middleware.js';

const logger = createLogger('unchained:core-payment:datatrans');

// v2
const {
  DATATRANS_SECRET,
  DATATRANS_SIGN_KEY,
  DATATRANS_API_ENDPOINT = 'https://api.sandbox.datatrans.com',
  DATATRANS_MERCHANT_ID,
} = process.env;

const newDatatransError = ({ code, message }: { code: string; message: string }) => {
  const error = new Error(message);
  error.name = `DATATRANS_${code}`;
  return error;
};

const throwIfResponseError = (result) => {
  if ((result as ResponseError).error) {
    const rawError = (result as ResponseError).error;
    throw newDatatransError(rawError);
  }
};

const Datatrans: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.datatrans',
  label: 'Datatrans',
  version: '2.0.0',

  initialConfiguration: [
    {
      key: 'merchantId',
      value: null,
    },
  ],

  typeSupported(type) {
    return type === 'GENERIC';
  },

  actions: (params) => {
    const { modules } = params.context;

    const getMerchantId = (): string | undefined => {
      return params.config.find((item) => item.key === 'merchantId')?.value || DATATRANS_MERCHANT_ID;
    };

    const api = () => {
      if (!DATATRANS_SECRET) throw new Error('Credentials not Set');
      return createDatatransAPI(DATATRANS_API_ENDPOINT, getMerchantId(), DATATRANS_SECRET);
    };

    const shouldSettleInUnchained = () => {
      return params.config.reduce((current, item) => {
        if (item.key === 'settleInUnchained') return Boolean(item.value);
        return current;
      }, true);
    };

    const getMarketplaceSplits = async (): Promise<
      {
        subMerchantId: string;
        amount: number;
        commission: number;
      }[]
    > => {
      const { order, orderPayment } = params.paymentContext;

      const pricingForOrderPayment = modules.orders.payments.pricingSheet(
        orderPayment,
        order.currency,
        params.context,
      );
      const pricing = modules.orders.pricingSheet(order);
      const { amount: total } = pricing.total({ useNetPrice: false });

      return Promise.all(
        params.config
          .filter((item) => item.key === 'marketplaceSplit')
          .map((item) => {
            const [subMerchantId, staticDiscountId, sharePercentage] = item.value
              .split(';')
              .map((f) => f.trim());

            const { amount: discountSum } = pricingForOrderPayment.total({
              category: PaymentPricingRowCategory.Tax,
              discountId: staticDiscountId,
            });
            const shareFactor = sharePercentage ? parseInt(sharePercentage, 10) / 100 : 1;
            const amount = Math.round(total * shareFactor);
            const commission = Math.round(discountSum * -1 * shareFactor);

            return {
              subMerchantId,
              amount,
              commission,
            };
          }),
      );
    };

    const authorize = async ({ paymentCredentials, ...arbitraryFields }): Promise<string> => {
      const { order, orderPayment } = params.paymentContext;
      const refno = Buffer.from(orderPayment._id, 'hex').toString('base64');
      const userId = order?.userId || params.paymentContext?.userId;
      const refno2 = userId;
      const { currency, amount } = roundedAmountFromOrder(order, params.context);
      const splits = await getMarketplaceSplits();
      const result = await api().authorize({
        ...arbitraryFields,
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
    };

    const authorizeAuth = async ({
      transactionId,
      refno,
      refno2,
      ...arbitraryFields
    }): Promise<string> => {
      const { order } = params.paymentContext;
      const { currency, amount } = roundedAmountFromOrder(order, params.context);
      const result = await api().authorizeAuthenticated({
        ...arbitraryFields,
        transactionId,
        amount,
        currency,
        refno,
        refno2,
        autoSettle: false,
      });
      throwIfResponseError(result);
      return (result as AuthorizeAuthenticatedResponseSuccess).acquirerAuthorizationCode;
    };

    const isTransactionAmountValid = (transaction: StatusResponseSuccess): boolean => {
      const { order } = params.paymentContext;
      const { currency, amount } = roundedAmountFromOrder(order, params.context);
      if (
        transaction.currency !== currency ||
        (transaction.detail.authorize as any)?.amount !== amount
      ) {
        logger.verbose(
          `currency: ${transaction.currency} === ${currency} => ${
            transaction.currency === currency
          }, amount: ${(transaction.detail.authorize as any)?.amount} === ${amount} => ${
            (transaction.detail.authorize as any)?.amount === amount
          }`,
        );
        return false;
      }
      return true;
    };

    const checkIfTransactionAmountValid = (
      transactionId: string,
      transaction: StatusResponseSuccess,
    ): void => {
      if (!isTransactionAmountValid(transaction)) {
        logger.error(
          `Transaction declined / Transaction ID ${transactionId} because of amount/currency mismatch`,
        );
        throw newDatatransError({
          code: `YOU_HAVE_TO_PAY_THE_FULL_AMOUNT_DUDE`,
          message: 'Amount / Currency Mismatch with Cart',
        });
      }
    };

    const settle = async ({ transactionId, refno, refno2, extensions }): Promise<boolean> => {
      const { order } = params.paymentContext;
      const { currency, amount } = roundedAmountFromOrder(order, params.context);
      const splits = await getMarketplaceSplits();
      const result = await api().settle({
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
    };

    const cancel = async ({ transactionId, refno }): Promise<boolean> => {
      const result = await api().cancel({
        transactionId,
        refno,
      });
      throwIfResponseError(result);
      return result as boolean;
    };

    const adapterActions = {
      ...PaymentAdapter.actions(params),

      configurationError() {
        if (!getMerchantId() || !DATATRANS_SECRET || !DATATRANS_SIGN_KEY) {
          return PaymentError.INCOMPLETE_CONFIGURATION;
        }
        return null;
      },

      isActive() {
        if (adapterActions.configurationError() === null) return true;
        return false;
      },

      isPayLaterAllowed() {
        return false;
      },

      async sign(transactionContext: any = {}) {
        const { useSecureFields = false, ...arbitraryFields } = transactionContext || {};
        const { orderPayment, paymentProviderId, order } = params.paymentContext;
        const refno = Buffer.from(orderPayment ? orderPayment._id : paymentProviderId, 'hex').toString(
          'base64',
        );
        const userId = order?.userId || params.paymentContext?.userId;
        const refno2 = userId;
        const price: { amount?: number; currency?: string } = order
          ? roundedAmountFromOrder(order, params.context)
          : {};

        if (useSecureFields) {
          const result = await api().secureFields({
            ...arbitraryFields,
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
        const result = await api().init({
          ...arbitraryFields,
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
      },

      async validate(credentials) {
        if (!credentials.meta) return false;
        const { objectKey, currency } = credentials.meta;
        const result = await api().validate({
          refno: Buffer.from(`valid-${new Date().getTime()}`, 'hex').toString('base64'),
          currency,
          [objectKey]: JSON.parse(credentials.token),
        });
        return Boolean((result as ValidateResponseSuccess)?.transactionId);
      },

      async register(transactionResponse) {
        const { transactionId } = transactionResponse;
        const result = (await api().status({
          transactionId,
        })) as StatusResponseSuccess;
        if (result.transactionId) {
          return parseRegistrationData(result);
        }
        return null;
      },

      async confirm() {
        if (!shouldSettleInUnchained()) return false;
        const { orderPayment, transactionContext } = params.paymentContext;
        const { transactionId } = orderPayment;

        const { extensions } = transactionContext || {};

        if (!transactionId) {
          return false;
        }
        const transaction: StatusResponseSuccess = (await api().status({
          transactionId,
        })) as StatusResponseSuccess;
        throwIfResponseError(transaction);
        const { status } = transaction;

        if (status === 'authorized') {
          // either settle or cancel
          // if further deferred settlement is active, don't settle in unchained and hand off
          // settlement to other systems
          await settle({
            transactionId,
            refno: transaction.refno,
            refno2: transaction.refno2,
            extensions,
          });
        }
        return true;
      },

      async cancel() {
        if (!shouldSettleInUnchained()) return false;
        const { orderPayment } = params.paymentContext;
        const { transactionId } = orderPayment;
        if (!transactionId) {
          return false;
        }
        const transaction: StatusResponseSuccess = (await api().status({
          transactionId,
        })) as StatusResponseSuccess;
        throwIfResponseError(transaction);
        const { status } = transaction;

        if (status === 'authorized') {
          // either settle or cancel
          // if further deferred settlement is active, don't settle in unchained and hand off
          // settlement to other systems
          await cancel({
            transactionId,
            refno: transaction.refno,
          });
        }
        return true;
      },

      async charge({
        transactionId: rawTransactionId,
        paymentCredentials,
        authorizeAuthenticated,
        ...arbitraryFields
      }) {
        if (!rawTransactionId && !paymentCredentials) {
          logger.warn(
            'Not trying to charge because of missing payment authorization response, return false to provide later',
          );
          return false;
        }

        const transactionId =
          rawTransactionId ||
          (await authorize({
            ...arbitraryFields,
            paymentCredentials,
          }));

        const transaction: StatusResponseSuccess = (await api().status({
          transactionId,
        })) as StatusResponseSuccess;
        throwIfResponseError(transaction);

        if (!transaction) {
          throw newDatatransError({
            code: `TRANSACTION_NOT_FOUND`,
            message: 'Amount / Currency Mismatch with Cart',
          });
        }
        let { status } = transaction;

        if (status === 'canceled' || status === 'failed') {
          logger.error(
            `Payment declined or canceled with Transaction ID ${transactionId} and status ${status}`,
          );
          throw newDatatransError({
            code: `STATUS_${status.toUpperCase()}`,
            message: 'Payment declined or canceled',
          });
        }

        if (status === 'authenticated') {
          if (authorizeAuthenticated) {
            checkIfTransactionAmountValid(transactionId, transaction);
            await authorizeAuth({
              ...(authorizeAuthenticated || {}),
              transactionId,
              refno: transaction.refno,
              refno2: transaction.refno2,
            });
            status = 'authorized';
          } else {
            logger.error(`Transaction declined / Transaction ID ${transactionId} not authorized yet`);
            throw newDatatransError({
              code: `STATUS_${status.toUpperCase()}`,
              message: 'Payment authenticated but not authorized',
            });
          }
        }

        if (status === 'authorized' || status === 'settled') {
          let settledTransaction = transaction;
          let credentials;
          // here we try to guard us against a potential
          // network hicup or registration data parsing error
          // at the dumbest possible moment
          try {
            checkIfTransactionAmountValid(transactionId, settledTransaction);
            credentials = parseRegistrationData(settledTransaction);
            const result = await api().status({
              transactionId,
            });
            if ((result as ResponseError)?.error) {
              settledTransaction = transaction;
            } else {
              settledTransaction = result as StatusResponseSuccess;
            }
          } catch (e) {
            await cancel({ transactionId, refno: settledTransaction.refno });
            logger.error(
              `Transaction declined / Transaction ID ${transactionId} authorization cancelled`,
            );
            throw newDatatransError({
              code: `STATUS_${status.toUpperCase()}`,
              message: 'Payment cancelled server-side because of amount missmatch',
            });
          }
          return {
            transactionId,
            settledTransaction,
            arbitraryFields,
            credentials,
          };
        }

        if (
          status === 'initialized' ||
          status === 'challenge_required' ||
          status === 'challenge_ongoing' ||
          status === 'transmitted'
        ) {
          logger.error(`Transaction ID ${transactionId} in transit with status ${status}`);
          throw newDatatransError({
            code: `STATUS_${status.toUpperCase()}`,
            message: 'Transaction status invalid for checkout',
          });
        }
        return false;
      },
    };

    return adapterActions;
  },
};

PaymentDirector.registerAdapter(Datatrans);
