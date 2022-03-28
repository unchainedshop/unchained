import { DeliveryProvider, DeliverySettings, FilterProviders } from '@unchainedshop/types/delivery';
import { createLogger } from 'meteor/unchained:logger';

const logger = createLogger('unchained:core-delivery');

const sortByCreationDate = (left: DeliveryProvider, right: DeliveryProvider) => {
  return new Date(left.created).getTime() - new Date(right.created).getTime();
};

const allProviders: FilterProviders = async ({ providers }) => {
  return providers.sort(sortByCreationDate);
};

const defaultFilterSupportedProviders =
  (sortProviders) =>
  async ({ providers }) => {
    return providers.sort(sortProviders);
  };

export const deliverySettings: DeliverySettings = {
  filterSupportedProviders: null,

  configureSettings({ sortProviders = undefined, filterSupportedProviders = allProviders } = {}) {
    if (sortProviders) {
      logger.warn('sortProviders is deprecated, please specifc filterSupportedProviders instead');
      this.filterSupportedProviders = defaultFilterSupportedProviders(sortProviders);
    } else {
      this.filterSupportedProviders = filterSupportedProviders;
    }
  },
};
