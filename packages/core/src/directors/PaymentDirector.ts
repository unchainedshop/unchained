import { BaseDirector, IBaseDirector } from '@unchainedshop/utils';
import { createLogger } from '@unchainedshop/logger';
import { PaymentError, IPaymentActions, IPaymentAdapter, PaymentContext } from './PaymentAdapter.js';
import { PaymentProvider } from '@unchainedshop/core-payment';
import { Order, OrderPayment, OrderPaymentStatus } from '@unchainedshop/core-orders';

const buildPaymentProviderActionsContext = (
  orderPayment: OrderPayment,
  { transactionContext, ...rest }: { transactionContext: any; userId: string },
) => ({
  ...rest,
  orderPayment,
  paymentProviderId: orderPayment.paymentProviderId,
  transactionContext: {
    ...(transactionContext || {}),
    ...(orderPayment.context || {}),
  },
});

export type IPaymentDirector = IBaseDirector<IPaymentAdapter> & {
  confirmOrderPayment: (
    order: Order,
    paymentContext: {
      transactionContext: any;
      userId: string;
    },
    unchainedAPI,
  ) => Promise<OrderPayment>;

  cancelOrderPayment: (
    order: Order,
    paymentContext: {
      transactionContext: any;
      userId: string;
    },
    unchainedAPI,
  ) => Promise<OrderPayment>;

  chargeOrderPayment: (
    order: Order,
    context: {
      transactionContext: any;
      userId: string;
    },
    unchainedAPI,
  ) => Promise<OrderPayment>;

  actions: (
    paymentProvider: PaymentProvider,
    paymentContext: PaymentContext,
    unchainedAPI,
  ) => Promise<IPaymentActions>;
};
const logger = createLogger('unchained:core:payment');
const baseDirector = BaseDirector<IPaymentAdapter>('PaymentDirector');

export const PaymentDirector: IPaymentDirector = {
  ...baseDirector,

  actions: async (paymentProvider, paymentContext, unchainedAPI) => {
    const Adapter = baseDirector.getAdapter(paymentProvider.adapterKey) as IPaymentAdapter;

    if (!Adapter) {
      throw new Error(`Payment Plugin ${paymentProvider.adapterKey} not available`);
    }

    const newPaymentContext: PaymentContext = {
      ...paymentContext,
    };

    if (paymentContext?.orderPayment) {
      const { modules } = unchainedAPI;
      const { orderId } = paymentContext.orderPayment;
      const order =
        paymentContext?.order ||
        (await modules.orders.findOrder({
          orderId,
        }));

      newPaymentContext.order = order;
    }

    const adapter = Adapter.actions(paymentProvider.configuration, {
      paymentProvider,
      paymentProviderId: paymentProvider._id,
      ...newPaymentContext,
      ...unchainedAPI,
    });

    return {
      configurationError: () => {
        try {
          const error = adapter.configurationError();
          return error;
        } catch {
          return PaymentError.ADAPTER_NOT_FOUND;
        }
      },

      isActive: () => {
        try {
          return adapter.isActive(paymentContext.transactionContext);
        } catch (error) {
          logger.error(error);
          return false;
        }
      },

      isPayLaterAllowed: () => {
        try {
          return adapter.isPayLaterAllowed(paymentContext.transactionContext);
        } catch (error) {
          logger.error(error);
          return false;
        }
      },

      charge: async () => {
        return adapter.charge(paymentContext.transactionContext);
      },

      register: async () => {
        return adapter.register(paymentContext.transactionContext);
      },

      sign: async () => {
        return adapter.sign(paymentContext.transactionContext);
      },

      validate: async () => {
        const validated = await adapter.validate(paymentContext.token);
        return !!validated;
      },

      cancel: async () => {
        return adapter.cancel(paymentContext.transactionContext);
      },

      confirm: async () => {
        return adapter.confirm(paymentContext.transactionContext);
      },
    };
  },

  confirmOrderPayment: async (
    order: Order,
    paymentContext: {
      transactionContext: any;
      userId: string;
    },
    unchainedAPI,
  ): Promise<OrderPayment> => {
    const { modules } = unchainedAPI;

    const orderPayment =
      order.paymentId &&
      (await modules.orders.payments.findOrderPayment({
        orderPaymentId: order.paymentId,
      }));

    if (!orderPayment) throw new Error('Order payment not set');

    if (modules.orders.payments.normalizedStatus(orderPayment) !== OrderPaymentStatus.PAID) {
      return orderPayment;
    }

    const paymentProvider = await modules.payment.paymentProviders.findProvider({
      paymentProviderId: orderPayment.paymentProviderId,
    });
    const actions = await PaymentDirector.actions(
      paymentProvider,
      buildPaymentProviderActionsContext(orderPayment, paymentContext),
      unchainedAPI,
    );

    const arbitraryResponseData = await actions.confirm();

    if (arbitraryResponseData) {
      return modules.orders.payments.updateStatus(orderPayment._id, {
        status: OrderPaymentStatus.PAID,
        info: JSON.stringify(arbitraryResponseData),
      });
    }

    return orderPayment;
  },

  cancelOrderPayment: async (
    order: Order,
    paymentContext: {
      transactionContext: any;
      userId: string;
    },
    unchainedAPI,
  ): Promise<OrderPayment> => {
    const { modules } = unchainedAPI;

    const orderPayment =
      order.paymentId &&
      (await modules.orders.payments.findOrderPayment({
        orderPaymentId: order.paymentId,
      }));

    if (!orderPayment) throw new Error('Order payment not set');

    if (modules.orders.payments.normalizedStatus(orderPayment) !== OrderPaymentStatus.PAID) {
      return orderPayment;
    }

    const paymentProvider = await modules.payment.paymentProviders.findProvider({
      paymentProviderId: orderPayment.paymentProviderId,
    });
    const actions = await PaymentDirector.actions(
      paymentProvider,
      buildPaymentProviderActionsContext(orderPayment, paymentContext),
      unchainedAPI,
    );
    const arbitraryResponseData = await actions.cancel();

    if (arbitraryResponseData) {
      return modules.orders.payments.updateStatus(orderPayment._id, {
        status: OrderPaymentStatus.REFUNDED,
        info: JSON.stringify(arbitraryResponseData),
      });
    }

    return orderPayment;
  },

  chargeOrderPayment: async (
    order: Order,
    context: {
      transactionContext: any;
      userId: string;
    },
    unchainedAPI,
  ): Promise<OrderPayment> => {
    const { modules } = unchainedAPI;

    const orderPayment =
      order.paymentId &&
      (await modules.orders.payments.findOrderPayment({
        orderPaymentId: order.paymentId,
      }));

    if (!orderPayment) throw new Error('Order payment not set');

    if (modules.orders.payments.normalizedStatus(orderPayment) !== OrderPaymentStatus.OPEN) {
      return orderPayment;
    }

    const paymentCredentials =
      context.transactionContext?.paymentCredentials ||
      (await modules.payment.paymentCredentials.findPaymentCredential({
        userId: context.userId,
        paymentProviderId: orderPayment.paymentProviderId,
        isPreferred: true,
      }));

    const paymentContext = buildPaymentProviderActionsContext(orderPayment, {
      ...context,
      transactionContext: {
        ...context.transactionContext,
        paymentCredentials,
      },
    });

    const paymentProvider = await modules.payment.paymentProviders.findProvider({
      paymentProviderId: orderPayment.paymentProviderId,
    });
    const actions = await PaymentDirector.actions(paymentProvider, paymentContext, unchainedAPI);
    const result = await actions.charge();

    if (!result) return orderPayment;

    const { credentials, ...arbitraryResponseData } = result;

    if (credentials) {
      const { token, ...meta } = credentials;
      await modules.payment.paymentCredentials.upsertCredentials({
        userId: paymentContext.userId,
        paymentProviderId: orderPayment.paymentProviderId,
        token,
        ...meta,
      });
    }

    if (arbitraryResponseData) {
      const { transactionId, ...info } = arbitraryResponseData;
      return modules.orders.payments.updateStatus(orderPayment._id, {
        transactionId,
        status: OrderPaymentStatus.PAID,
        info: JSON.stringify(info),
      });
    }

    return orderPayment;
  },
};
