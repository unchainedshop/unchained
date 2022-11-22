import {
  DeliveryProvider,
  DeliverySettings,
  DetermineDefaultProvider,
  FilterProviders,
} from '@unchainedshop/types/delivery';
import { createLogger } from '@unchainedshop/logger';

const logger = createLogger('unchained:core-delivery');

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
