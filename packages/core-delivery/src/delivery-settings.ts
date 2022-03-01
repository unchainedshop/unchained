import { DeliveryProvider, DeliverySettings, FilterProviders } from '@unchainedshop/types/delivery';
import { createLogger } from 'meteor/unchained:logger';

const logger = createLogger('unchained:core-delivery');

const sortByCreationDate = (left: DeliveryProvider, right: DeliveryProvider) => {
  return new Date(left.created).getTime() - new Date(right.created).getTime();
};

const allProviders: FilterProviders = ({ providers }) => {
  return providers.sort(sortByCreationDate);
};

export const deliverySettings: DeliverySettings = {
  filterSupportedProviders: null,

  configureSettings({ sortProviders, filterSupportedProviders = allProviders }) {
    if (sortProviders) {
      logger.warn('sortProviders is deprecated, please specifc filterSupportedProviders instead');
      this.filterSupportedProviders = ({ providers }) => {
        return providers.sort(sortProviders);
      };
    }
    this.filterSupportedProviders = filterSupportedProviders;
  },
};
