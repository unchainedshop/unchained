import { PaymentProvider, PaymentSettings, FilterProviders } from '@unchainedshop/types/delivery';
import { createLogger } from 'meteor/unchained:logger';

const logger = createLogger('unchained:core-payment');

const sortByCreationDate = () => (left: PaymentProvider, right: PaymentProvider) => {
  return new Date(left.created).getTime() - new Date(right.created).getTime();
};

const allProviders: FilterProviders = ({ providers }) => {
  return providers.sort(sortByCreationDate);
};

const defaultFilterSupportedProviders =
  (sortProviders) =>
  async ({ providers }) => {
    return providers.sort(sortProviders);
  };

export const paymentSettings: PaymentSettings = {
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
