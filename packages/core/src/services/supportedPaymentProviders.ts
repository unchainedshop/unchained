import {
  PaymentContext,
  PaymentDirector,
  PaymentModule,
  PaymentProvider,
  paymentSettings,
} from '@unchainedshop/core-payment';

export const supportedPaymentProvidersService = async (
  params: PaymentContext,
  unchainedAPI: {
    modules: {
      payment: PaymentModule;
    };
  },
) => {
  const allProviders = await unchainedAPI.modules.payment.paymentProviders.findProviders({});

  const providers = (
    await Promise.all(
      allProviders.map(async (provider: PaymentProvider) => {
        const adapter = await PaymentDirector.actions(provider, params, unchainedAPI);
        return adapter.isActive() ? [provider] : [];
      }),
    )
  ).flat();

  return paymentSettings.filterSupportedProviders(
    {
      providers,
      order: params.order,
    },
    unchainedAPI,
  );
};
