import { createLogger } from '@unchainedshop/logger';
import { mapOrderDataToGatewayObject, mapUserToGatewayObject } from './payrexx.js';
import createPayrexxAPI, { GatewayObjectStatus } from './api/index.js';
import {
  OrderPricingSheet,
  IPaymentAdapter,
  PaymentAdapter,
  PaymentDirector,
  PaymentError,
} from '@unchainedshop/core';

const logger = createLogger('unchained:payrexx');

const Payrexx: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.payment.payrexx',
  label: 'Payrexx',
  version: '1.0.0',

  typeSupported(type) {
    return type === 'GENERIC';
  },

  actions: (config, context) => {
    const { modules } = context;

    const instance = config.find((c) => c.key === 'instance')?.value;

    const adapterActions = {
      ...PaymentAdapter.actions(config, context),

      configurationError() {
        if (!process.env.PAYREXX_SECRET) {
          return PaymentError.INCOMPLETE_CONFIGURATION;
        }
        if (!instance) {
          return PaymentError.INCOMPLETE_CONFIGURATION;
        }
        return null;
      },

      isActive: () => {
        if (adapterActions.configurationError() === null) return true;
        return false;
      },

      isPayLaterAllowed() {
        return false;
      },

      sign: async (transactionContext = {}) => {
        const { orderPayment, userId, order } = context;

        if (!order) throw new Error('No order in context, can only sign with order context');

        const api = createPayrexxAPI(instance!, process.env.PAYREXX_SECRET!);

        if (orderPayment) {
          // Order Checkout signing (One-time payment)
          const pricing = OrderPricingSheet({
            calculation: order.calculation,
            currencyCode: order.currencyCode,
          });
          const gatewayObject = mapOrderDataToGatewayObject(
            { order, orderPayment, pricing },
            transactionContext,
          );
          const gateway = await api.createGateway(gatewayObject);
          return JSON.stringify(gateway);
        }

        // Payment Credential Registration signing

        const user = userId && (await modules.users.findUserById(userId));
        if (!user) throw new Error('User not found, can only sign registrations with user context');

        const emailAddress = modules.users.primaryEmail(user)?.address;
        const gateway = await api.createGateway(
          mapUserToGatewayObject({
            userId,
            emailAddress,
            currencyCode: order?.currencyCode,
          }),
        );
        return JSON.stringify(gateway);
      },

      // async validate(credentials) {
      //   if (!credentials.meta) return false;
      //   const { objectKey, currency } = credentials.meta;
      //   const result = await api().validate({
      //     refno: Buffer.from(`valid-${new Date().getTime()}`, 'hex').toString('base64'),
      //     currency,
      //     [objectKey]: JSON.parse(credentials.token),
      //   });
      //   return Boolean((result as ValidateResponseSuccess)?.transactionId);
      // },

      async register(/* transactionResponse */) {
        // const { transactionId } = transactionResponse;
        throw new Error('Not implemented');
        // const result = (await api().status({
        //   transactionId,
        // })) as StatusResponseSuccess;
        // if (result.transactionId) {
        //   return await parseRegistrationData(result);
        // }
        return null;
      },

      async confirm() {
        const { orderPayment } = context;

        if (!orderPayment?.transactionId) {
          return false;
        }
        const { transactionId } = orderPayment;

        const api = createPayrexxAPI(instance!, process.env.PAYREXX_SECRET!);

        const gatewayObject = await api.getGateway(transactionId);

        if (!gatewayObject) {
          return false;
        }

        if (
          // gatewayObject.status === GatewayObjectStatus.authorized || // authorized is only used for tokenization!
          gatewayObject.status === GatewayObjectStatus.reserved
        ) {
          const allTransactions = gatewayObject.invoices?.flatMap((invoice) => invoice.transactions);
          await Promise.all(
            allTransactions.map(async (transaction) =>
              api.chargePreAuthorized(transaction.id, { referenceId: '__IGNORE_WEBHOOK__' }),
            ),
          );
          return true;
        }

        if (gatewayObject.status === GatewayObjectStatus.confirmed) {
          return true; // already confirmed, no need to confirm
        }
        return false; // some other status with refund or anything, can't confirm!
      },

      async cancel() {
        const { orderPayment } = context;
        if (!orderPayment?.transactionId) {
          return false;
        }
        const { transactionId } = orderPayment;

        const api = createPayrexxAPI(instance!, process.env.PAYREXX_SECRET!);

        const gatewayObject = await api.getGateway(transactionId);

        if (!gatewayObject) {
          return false;
        }

        if (gatewayObject.status === GatewayObjectStatus.reserved) {
          const allTransactions = gatewayObject.invoices?.flatMap((invoice) => invoice.transactions);
          await Promise.all(
            allTransactions.map(async (transaction) => api.deleteReservation(transaction.id)),
          );
          return true;
        }

        if (gatewayObject.status === GatewayObjectStatus.confirmed) {
          return false; // already confirmed, can't cancel anymore
        }
        return true; // some other status with refund or anything, no need to cancel
      },

      charge: async ({ gatewayId, paymentCredentials }) => {
        if (!gatewayId && !paymentCredentials) {
          throw new Error('You have to provide gatewayId or paymentCredentials');
        }

        const { order, orderPayment } = context;

        if (!order) throw new Error('No order in context, can only charge with order context');
        if (!orderPayment) throw new Error('Order payment not found');

        const api = createPayrexxAPI(instance!, process.env.PAYREXX_SECRET!);

        const gatewayObject = await api.getGateway(gatewayId);

        if (!gatewayObject) {
          throw new Error('Could not load gateway from the Payrexx API');
        }

        const pricing = OrderPricingSheet({
          calculation: order.calculation,
          currencyCode: order.currencyCode,
        });
        const { currencyCode, amount } = pricing.total({ useNetPrice: false });

        if (
          // gatewayObject.status === 'authorized' || // authorized is only used for tokenization!
          gatewayObject.status === 'reserved' ||
          gatewayObject.status === 'confirmed'
        ) {
          try {
            if (
              gatewayObject.currency !== currencyCode.toUpperCase() ||
              gatewayObject.amount !== Math.round(amount)
            ) {
              throw new Error('The price has changed since the intent has been created');
            }
            if (gatewayObject.referenceId !== orderPayment?._id) {
              throw new Error('The order payment is different from the initiating intent');
            }

            // confirm will do the transition, to do a checkout those stati above are fine
            logger.info(`Mark as charged, status is ${gatewayObject.status}`, {
              orderPaymentId: gatewayObject.referenceId,
            });
            return {
              transactionId: gatewayId,
              gatewayObject,
            };
          } catch (e) {
            if (gatewayObject.status === GatewayObjectStatus.reserved) {
              // Cancel the reservation if it's reserved and the order has been manipulated
              const allTransactions = gatewayObject.invoices?.flatMap((invoice) => invoice.transactions);
              await Promise.all(
                allTransactions.map(async (transaction) => api.deleteReservation(transaction.id)),
              );
            }
            throw e;
          }
        }

        logger.info('Charge not possible', {
          orderPaymentId: gatewayObject.referenceId,
          status: gatewayObject.status,
        });
        throw new Error(`Gateway Status ${gatewayObject.status} does not allow checkout`);
      },
    };

    return adapterActions;
  },
};

PaymentDirector.registerAdapter(Payrexx);
