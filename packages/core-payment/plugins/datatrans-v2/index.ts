import { IPaymentAdapter } from '@unchainedshop/types/payments';
import { PaymentAdapter, PaymentError, PaymentDirector } from 'meteor/unchained:core-payment';
import { createLogger } from 'meteor/unchained:logger';
import createDatatransAPI from './api';
import type {
  AuthorizeAuthenticatedResponseSuccess,
  AuthorizeResponseSuccess,
  InitResponseSuccess,
  ResponseError,
  StatusResponseSuccess,
  ValidateResponseSuccess,
} from './api/types';
import './middleware';
import parseRegistrationData from './parseRegistrationData';
import roundedAmountFromOrder from './roundedAmountFromOrder';

const logger = createLogger('unchained:core-payment:datatrans');

// v2
const { DATATRANS_SECRET, DATATRANS_SIGN_KEY, DATATRANS_API_ENDPOINT } = process.env;

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
  label: 'Datatrans (https://docs.datatrans.ch)',
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
    const getMerchantId = (): string | undefined => {
      return params.config.find((item) => item.key === 'merchantId')?.value;
    };

    const api = () => {
      if (!DATATRANS_SECRET) throw new Error('Credentials not Set');
      return createDatatransAPI(
        DATATRANS_API_ENDPOINT || 'https://api.sandbox.datatrans.com',
        getMerchantId(),
        DATATRANS_SECRET,
      );
    };

    const shouldSettleInUnchained = () => {
      return params.config.reduce((current, item) => {
        if (item.key === 'settleInUnchained') return Boolean(item.value);
        return current;
      }, true);
    };

    const getMarketplaceSplits = (): {
      subMerchantId: string;
      amount: number;
      comission: number;
    }[] => {
      return params.config.flatMap((item) => {
        if (item.key === 'marketplaceSplit') {
          const [subMerchantId, amount, comission] = item.value.split(';').map((f) => f.trim());
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
    };

    const authorize = async ({ paymentCredentials, extensions }): Promise<string> => {
      const splits = getMarketplaceSplits();
      const { userId } = params.context;
      const { order, orderPayment } = params.paymentContext;
      const refno = orderPayment._id;
      const refno2 = userId;
      const { currency, amount } = roundedAmountFromOrder(order, params.context);
      const result = await api().authorize({
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
    };

    const authorizeAuth = async ({ transactionId, refno, refno2, extensions }): Promise<string> => {
      const { order } = params.paymentContext;
      const { currency, amount } = roundedAmountFromOrder(order, params.context);
      const result = await api().authorizeAuthenticated({
        ...extensions,
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
            transaction.currency !== currency
          }, amount: ${(transaction.detail.authorize as any)?.amount} === ${amount} => ${
            (transaction.detail.authorize as any)?.amount !== amount
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
          `Datatrans Plugin: Transaction declined / Transaction ID ${transactionId} because of amount/currency mismatch`,
        );
        throw newDatatransError({
          code: `YOU_HAVE_TO_PAY_THE_FULL_AMOUNT_DUDE`,
          message: 'Amount / Currency Mismatch with Cart',
        });
      }
    };

    const settle = async ({ transactionId, refno, refno2, extensions }): Promise<boolean> => {
      const splits = getMarketplaceSplits();
      const { order } = params.paymentContext;
      const { currency, amount } = roundedAmountFromOrder(order, params.context);
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
        if (this.configurationError() === null) return true;
        return false;
      },

      isPayLaterAllowed() {
        return false;
      },

      async sign(context: any = {}) {
        const { useSecureFields = false, ...additionalInitPayload } = context.transactionContext || {};

        const { userId } = params.context;
        const { orderPayment, paymentProviderId, order } = params.paymentContext;
        const refno = orderPayment ? orderPayment._id : paymentProviderId;
        const refno2 = userId;

        const price: { amount?: number; currency?: string } = order
          ? roundedAmountFromOrder(order, params.context)
          : {};

        if (useSecureFields) {
          const result = await api().secureFields({
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
        const result = await api().init({
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
      },

      async validate(token) {
        if (!params.paymentContext.meta) return false;
        const { objectKey, currency } = params.paymentContext.meta;
        const result = await api().validate({
          refno: `valid-${new Date().getTime()}`,
          currency,
          [objectKey]: JSON.parse(token),
        });
        return (result as ValidateResponseSuccess)?.transactionId;
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

      async charge({
        transactionId: rawTransactionId,
        paymentCredentials,
        authorizeAuthenticated,
        ...extensions
      }) {
        if (!rawTransactionId && !paymentCredentials) {
          logger.warn(
            'Datatrans Plugin: Not trying to charge because of missing payment authorization response, return false to provide later',
          );
          return false;
        }

        const transactionId =
          rawTransactionId ||
          (await authorize({
            paymentCredentials,
            extensions,
          }));

        const transaction: StatusResponseSuccess = (await api().status({
          transactionId,
        })) as StatusResponseSuccess;
        throwIfResponseError(transaction);
        let status = transaction?.status;

        if (status === 'canceled' || status === 'failed') {
          logger.error(
            `Datatrans Plugin: Transaction declined / Transaction ID ${transactionId} has invalid status`,
          );
          throw newDatatransError({
            code: `STATUS_${status.toUpperCase()}`,
            message: 'Payment declined',
          });
        }

        if (status === 'authenticated') {
          if (authorizeAuthenticated) {
            checkIfTransactionAmountValid(transactionId, transaction);
            await authorizeAuth({
              transactionId,
              refno: transaction.refno,
              refno2: transaction.refno2,
              extensions: authorizeAuthenticated,
            });
            status = 'authorized';
          } else {
            logger.error(
              `Datatrans Plugin: Transaction declined / Transaction ID ${transactionId} not authorized yet`,
            );
            throw newDatatransError({
              code: `STATUS_${status.toUpperCase()}`,
              message: 'Payment not yet authorized',
            });
          }
        }

        if (status === 'authorized') {
          // either settle or cancel
          try {
            checkIfTransactionAmountValid(transactionId, transaction);
            if (shouldSettleInUnchained()) {
              // if further deferred settlement is active, don't settle in unchained and hand off
              // settlement to other systems
              await settle({
                transactionId,
                refno: transaction.refno,
                refno2: transaction.refno2,
                extensions,
              });
              status = 'settled';
            }
          } catch (e) {
            try {
              await cancel({
                transactionId,
                refno: transaction.refno,
              });
            } catch (ee) {
              //
            }
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
            const result = await api().status({
              transactionId,
            });
            if ((result as ResponseError)?.error) {
              settledTransaction = transaction;
            } else {
              settledTransaction = result as StatusResponseSuccess;
            }
          } catch (e) {
            // Don't throw further, we don't want to lose cart/settlement links
            logger.warn(
              `Datatrans Plugin: Existing Transaction could not be retrieved with ID ${transactionId}`,
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
          logger.warn(
            `Datatrans Plugin: Transaction ID ${transactionId} in transit with status ${status}`,
          );
          return false;
        }
        return false;
      },
    };

    return adapterActions;
  },
};

PaymentDirector.registerAdapter(Datatrans);
