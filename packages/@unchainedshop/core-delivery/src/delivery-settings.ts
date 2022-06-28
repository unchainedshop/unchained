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

const defaultFilterSupportedProviders =
  (sortProviders) =>
  async ({ providers }) => {
    return providers.sort(sortProviders);
  };

export const deliverySettings: DeliverySettings = {
  filterSupportedProviders: null,
  determineDefaultProvider: null,

  configureSettings({
    sortProviders = undefined,
    filterSupportedProviders = allProviders,
    determineDefaultProvider = firstProviderIsDefault,
  } = {}) {
    if (sortProviders) {
      logger.warn('sortProviders is deprecated, please specifc filterSupportedProviders instead');
      deliverySettings.filterSupportedProviders = defaultFilterSupportedProviders(sortProviders);
    } else {
      deliverySettings.filterSupportedProviders = filterSupportedProviders;
    }
    deliverySettings.determineDefaultProvider = determineDefaultProvider;
  },
};
