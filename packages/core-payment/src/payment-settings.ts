import {
  PaymentProvider,
  PaymentSettings,
  FilterProviders,
  DetermineDefaultProvider,
} from '@unchainedshop/types/payments';

const sortByCreationDate = (left: PaymentProvider, right: PaymentProvider) => {
  return new Date(left.created).getTime() - new Date(right.created).getTime();
};

const allProviders: FilterProviders = async ({ providers }) => {
  return providers.sort(sortByCreationDate);
};

const firstProviderIsDefault: DetermineDefaultProvider = async ({ providers, paymentCredentials }) => {
  const foundSupportedPreferredProvider = providers.find((supportedPaymentProvider) => {
    return paymentCredentials.some((paymentCredential) => {
      return supportedPaymentProvider._id === paymentCredential.paymentProviderId;
    });
  });
  if (foundSupportedPreferredProvider) return foundSupportedPreferredProvider;
  return providers?.length > 0 && providers[0];
};

export const paymentSettings: PaymentSettings = {
  filterSupportedProviders: null,
  determineDefaultProvider: null,

  configureSettings({
    filterSupportedProviders = allProviders,
    determineDefaultProvider = firstProviderIsDefault,
  } = {}) {
    paymentSettings.filterSupportedProviders = filterSupportedProviders;
    paymentSettings.determineDefaultProvider = determineDefaultProvider;
  },
};
