import { createLogger } from 'meteor/unchained:core-logger';

const logger = createLogger('unchained:core-payment');

const sortByCreationDate = () => (left, right) => {
  return new Date(left.created).getTime() - new Date(right.created).getTime();
};

const allProviders = ({ providers }) => {
  return providers.sort(sortByCreationDate);
};

const settings = {
  filterSupportedProviders: null,
  load({ sortProviders, filterSupportedProviders = allProviders } = {}) {
    if (sortProviders) {
      logger.warn(
        'sortProviders is deprecated, please specifc filterSupportedProviders instead',
      );
      this.filterSupportedProviders = ({ providers }) => {
        return providers.sort(sortProviders).map(({ _id }) => _id);
      };
    } else {
      this.filterSupportedProviders = filterSupportedProviders;
    }
  },
};

export default settings;
