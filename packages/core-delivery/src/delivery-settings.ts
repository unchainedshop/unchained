import type { DeliveryProvider } from './module/configureDeliveryModule.ts';

export type FilterProviders<Order = unknown, UnchainedAPI = unknown> = (
  params: {
    providers: DeliveryProvider[];
    order: Order;
  },
  unchainedAPI: UnchainedAPI,
) => Promise<DeliveryProvider[]>;

export type DetermineDefaultProvider<Order = unknown, UnchainedAPI = unknown> = (
  params: {
    providers: DeliveryProvider[];
    order: Order;
  },
  unchainedAPI: UnchainedAPI,
) => Promise<DeliveryProvider | null>;
export type DeliverySettingsOptions = Omit<Partial<DeliverySettings>, 'configureSettings'>;

export interface DeliverySettings {
  filterSupportedProviders: FilterProviders;
  determineDefaultProvider: DetermineDefaultProvider;
  configureSettings: (options?: DeliverySettingsOptions) => void;
}

const sortByCreationDate = (left: DeliveryProvider, right: DeliveryProvider) => {
  return new Date(left.created).getTime() - new Date(right.created).getTime();
};

const allProviders: FilterProviders = async ({ providers }) => {
  return providers.toSorted(sortByCreationDate);
};

const firstProviderIsDefault: DetermineDefaultProvider = async ({ providers }) => {
  return (providers?.length > 0 && providers[0]) || null;
};

export const deliverySettings: DeliverySettings = {
  filterSupportedProviders: allProviders,
  determineDefaultProvider: firstProviderIsDefault,
  configureSettings({
    filterSupportedProviders = allProviders,
    determineDefaultProvider = firstProviderIsDefault,
  } = {}) {
    deliverySettings.filterSupportedProviders = filterSupportedProviders;
    deliverySettings.determineDefaultProvider = determineDefaultProvider;
  },
};
