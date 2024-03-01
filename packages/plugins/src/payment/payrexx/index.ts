import { IPaymentAdapter } from '@unchainedshop/types/payments.js';
import { PaymentAdapter, PaymentDirector, PaymentError } from '@unchainedshop/core-payment';
import { createLogger } from '@unchainedshop/logger';
import { mapOrderDataToGatewayObject } from './payrexx.js';
import createPayrexxAPI, { GatewayObjectStatus } from './api/index.js';

export * from './middleware.js';

const logger = createLogger('unchained:core-payment:payrexx');

const Payrexx: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.payment.payrexx',
  label: 'Payrexx',
  version: '1.0.0',

  typeSupported(type) {
    return type === 'GENERIC';
  },

  actions: (params) => {
    const { modules } = params.context;

    const getInstance = () => {
      return params.config.find((c) => c.key === 'instance')?.value;
    };

    const api = createPayrexxAPI(getInstance(), process.env.PAYREXX_SECRET);

    const adapterActions = {
      ...PaymentAdapter.actions(params),

      configurationError() {
        if (!process.env.PAYREXX_SECRET) {
          return PaymentError.INCOMPLETE_CONFIGURATION;
        }
        if (!getInstance()) {
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

      validate: async () => {
        throw new Error('Token Registration Flow not implemented yet');
      },

      register: async () => {
        throw new Error('Token Registration Flow not implemented yet');
      },

      sign: async (transactionContext = {}) => {
        const { orderPayment, order } = params.paymentContext;
        if (orderPayment) {
          const pricing = await modules.orders.pricingSheet(order);
          const gatewayObject = mapOrderDataToGatewayObject(
            { order, orderPayment, pricing },
            transactionContext,
          );
          const gateway = await api.createGateway(gatewayObject);
          return JSON.stringify(gateway);
        }

        throw new Error('Token Registration Flow not implemented yet');
      },

      async confirm() {
        const { orderPayment } = params.paymentContext;
        const { transactionId } = orderPayment;

        if (!transactionId) {
          return false;
        }

        const gatewayObject = await api.getGateway(transactionId);

        if (!gatewayObject) {
          return false;
        }

        if (
          gatewayObject.status === GatewayObjectStatus.authorized ||
          gatewayObject.status === GatewayObjectStatus.reserved
        ) {
          const allTransactions = gatewayObject.invoices?.flatMap((invoice) => invoice.transactions);
          await Promise.all(
            allTransactions.map(async (transaction) =>
              api.chargePreAuthorized(transaction.id, { referenceId: orderPayment._id }),
            ),
          );
          return true;
        }
        return false;
      },

      async cancel() {
        const { orderPayment } = params.paymentContext;
        const { transactionId } = orderPayment;
        if (!transactionId) {
          return false;
        }

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
        return false;
      },

      charge: async ({ gatewayId, paymentCredentials }) => {
        if (!gatewayId && !paymentCredentials) {
          throw new Error('You have to provide gatewayId or paymentCredentials');
        }

        const { order } = params.paymentContext;
        const orderPayment = await modules.orders.payments.findOrderPayment({
          orderPaymentId: order.paymentId,
        });

        const gatewayObject = await api.getGateway(gatewayId);

        if (!gatewayObject) {
          throw new Error('Could not load gateway from the Payrexx API');
        }

        const pricing = await modules.orders.pricingSheet(order);
        const { currency, amount } = pricing.total({ useNetPrice: false });

        if (
          gatewayObject.currency !== currency.toUpperCase() ||
          gatewayObject.amount !== Math.round(amount)
        ) {
          throw new Error('The price has changed since the intent has been created');
        }
        if (gatewayObject.referenceId !== orderPayment?._id) {
          throw new Error('The order payment is different from the initiating intent');
        }

        switch (gatewayObject.status) {
          case GatewayObjectStatus.waiting:
            logger.verbose('Charge postponed because Gateway is pending', {
              orderPaymentId: gatewayObject.referenceId,
            });
            return false;
          case GatewayObjectStatus.authorized:
          case GatewayObjectStatus.reserved:
          case GatewayObjectStatus.confirmed:
            // confirm will do the transition, to do a checkout those stati above are fine
            logger.verbose(`Mark as charged, status is ${gatewayObject.status}`, {
              orderPaymentId: gatewayObject.referenceId,
            });
            return {
              transactionId: gatewayId,
              gatewayObject,
            };
          default:
            logger.verbose('Charge not possible', {
              orderPaymentId: gatewayObject.referenceId,
              status: gatewayObject.status,
            });
            throw new Error(`Gateway Status ${gatewayObject.status} does not allow checkout`);
        }
      },
    };

    return adapterActions;
  },
};

PaymentDirector.registerAdapter(Payrexx);
