import type { PaymentCredentials } from './module/configurePaymentCredentialsModule.ts';
import type { PaymentProvider } from './module/configurePaymentProvidersModule.ts';

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
) => Promise<PaymentProvider | null>;

export interface PaymentSettings {
  filterSupportedProviders: FilterProviders;
  determineDefaultProvider: DetermineDefaultProvider;
  configureSettings: (options?: PaymentSettingsOptions) => void;
}

export type PaymentSettingsOptions = Omit<Partial<PaymentSettings>, 'configureSettings'>;

const sortByCreationDate = (left: PaymentProvider, right: PaymentProvider) => {
  return new Date(left.created).getTime() - new Date(right.created).getTime();
};

const allProviders: FilterProviders = async ({ providers }) => {
  return providers.toSorted(sortByCreationDate);
};

const firstProviderIsDefault: DetermineDefaultProvider = async ({ providers, paymentCredentials }) => {
  const foundSupportedPreferredProvider = providers.find((supportedPaymentProvider) => {
    return paymentCredentials?.some((paymentCredential) => {
      return supportedPaymentProvider._id === paymentCredential.paymentProviderId;
    });
  });
  if (foundSupportedPreferredProvider) return foundSupportedPreferredProvider;
  return (providers?.length > 0 && providers[0]) || null;
};

export const paymentSettings: PaymentSettings = {
  filterSupportedProviders: allProviders,
  determineDefaultProvider: firstProviderIsDefault,
  configureSettings({ filterSupportedProviders, determineDefaultProvider } = {}) {
    paymentSettings.filterSupportedProviders = filterSupportedProviders || allProviders;
    paymentSettings.determineDefaultProvider = determineDefaultProvider || firstProviderIsDefault;
  },
};
