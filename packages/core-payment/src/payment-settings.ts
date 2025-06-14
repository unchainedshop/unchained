import { PaymentCredentials } from './db/PaymentCredentialsCollection.js';
import { PaymentProvider } from './db/PaymentProvidersCollection.js';

export type FilterProviders<Order = unknown, UnchainedAPI = unknown> = (
  params: {
    providers: PaymentProvider[];
    order: Order;
  },
  unchainedAPI: UnchainedAPI,
) => Promise<PaymentProvider[]>;

export type DetermineDefaultProvider<Order = unknown, UnchainedAPI = unknown> = (
  params: {
    providers: PaymentProvider[];
    order: Order;
    paymentCredentials?: PaymentCredentials[];
  },
  unchainedAPI: UnchainedAPI,
) => Promise<PaymentProvider>;
export interface PaymentSettingsOptions {
  sortProviders?: (a: PaymentProvider, b: PaymentProvider) => number;
  filterSupportedProviders?: FilterProviders;
  determineDefaultProvider?: DetermineDefaultProvider;
}

export interface PaymentSettings {
  filterSupportedProviders: FilterProviders;
  determineDefaultProvider: DetermineDefaultProvider;
  configureSettings: (options?: PaymentSettingsOptions) => void;
}

const sortByCreationDate = (left: PaymentProvider, right: PaymentProvider) => {
  return new Date(left.created).getTime() - new Date(right.created).getTime();
};

const allProviders: FilterProviders = async ({ providers }) => {
  return providers.toSorted(sortByCreationDate);
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
