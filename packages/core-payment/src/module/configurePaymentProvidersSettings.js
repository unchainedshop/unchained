import { paymentLogger } from '../payment-logger';

const sortByCreationDate = () => (left, right) => {
  return new Date(left.created).getTime() - new Date(right.created).getTime();
};

const allProviders = ({ providers }) => {
  return providers.sort(sortByCreationDate);
};

export const paymentProviderSettings = {
  filterSupportedProviders: null,
  configureSettings({ sortProviders = undefined, filterSupportedProviders = allProviders } = {}) {
    if (sortProviders) {
      paymentLogger.warn('sortProviders is deprecated, please specifc filterSupportedProviders instead');
      this.filterSupportedProviders = ({ providers }) => {
        return providers.sort(sortProviders);
      };
    } else {
      this.filterSupportedProviders = filterSupportedProviders;
    }
  },
};
