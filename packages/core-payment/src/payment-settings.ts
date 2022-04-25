import {
  PaymentProvider,
  PaymentSettings,
  FilterProviders,
  DetermineDefaultProvider,
} from '@unchainedshop/types/payments';
import { createLogger } from 'meteor/unchained:logger';

const logger = createLogger('unchained:core-payment');

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

const defaultFilterSupportedProviders =
  (sortProviders) =>
  async ({ providers }) => {
    return providers.sort(sortProviders);
  };

export const paymentSettings: PaymentSettings = {
  filterSupportedProviders: null,
  determineDefaultProvider: null,

  configureSettings({
    sortProviders = undefined,
    filterSupportedProviders = allProviders,
    determineDefaultProvider = firstProviderIsDefault,
  } = {}) {
    if (sortProviders) {
      logger.warn('sortProviders is deprecated, please specifc filterSupportedProviders instead');
      paymentSettings.filterSupportedProviders = defaultFilterSupportedProviders(sortProviders);
    } else {
      paymentSettings.filterSupportedProviders = filterSupportedProviders;
    }
    paymentSettings.determineDefaultProvider = determineDefaultProvider;
  },
};
