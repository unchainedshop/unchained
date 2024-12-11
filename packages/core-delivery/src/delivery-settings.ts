import { DeliveryProvider } from './db/DeliveryProvidersCollection.js';

export type FilterProviders<Order = unknown, UnchainedAPI = unknown> = (
  params: {
    providers: Array<DeliveryProvider>;
    order: Order;
  },
  unchainedAPI: UnchainedAPI,
) => Promise<Array<DeliveryProvider>>;

export type DetermineDefaultProvider<Order = unknown, UnchainedAPI = unknown> = (
  params: {
    providers: Array<DeliveryProvider>;
    order: Order;
  },
  unchainedAPI: UnchainedAPI,
) => Promise<DeliveryProvider>;
export interface DeliverySettingsOptions {
  sortProviders?: (a: DeliveryProvider, b: DeliveryProvider) => number;
  filterSupportedProviders?: FilterProviders;
  determineDefaultProvider?: DetermineDefaultProvider;
}

export interface DeliverySettings {
  filterSupportedProviders: FilterProviders;
  determineDefaultProvider: DetermineDefaultProvider;
  configureSettings: (options?: DeliverySettingsOptions) => void;
}

const sortByCreationDate = (left: DeliveryProvider, right: DeliveryProvider) => {
  return new Date(left.created).getTime() - new Date(right.created).getTime();
};

const allProviders: FilterProviders = async ({ providers }) => {
  return providers.sort(sortByCreationDate);
};

const firstProviderIsDefault: DetermineDefaultProvider = async ({ providers }) => {
  return providers?.length > 0 && providers[0];
};

export const deliverySettings: DeliverySettings = {
  filterSupportedProviders: null,
  determineDefaultProvider: null,

  configureSettings({
    filterSupportedProviders = allProviders,
    determineDefaultProvider = firstProviderIsDefault,
  } = {}) {
    deliverySettings.filterSupportedProviders = filterSupportedProviders;
    deliverySettings.determineDefaultProvider = determineDefaultProvider;
  },
};
