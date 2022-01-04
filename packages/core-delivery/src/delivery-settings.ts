import { DeliveryProvider } from '@unchainedshop/types/delivery';
import { createLogger } from 'meteor/unchained:logger';
import { dbIdToString } from 'meteor/unchained:utils';

const logger = createLogger('unchained:core-delivery');

const sortByCreationDate = (
  left: DeliveryProvider,
  right: DeliveryProvider
) => {
  return new Date(left.created).getTime() - new Date(right.created).getTime();
};

type FilterProviders = (params: {
  providers: Array<DeliveryProvider>;
}) => Array<string>;

const allProviders: FilterProviders = ({ providers }) => {
  return providers.sort(sortByCreationDate).map(({ _id }) => _id as string);
};

interface DeliverySettings {
  filterSupportedProviders: FilterProviders | null;
  load: (params: {
    sortProviders?: (a: DeliveryProvider, b: DeliveryProvider) => number;
    filterSupportedProviders: FilterProviders;
  }) => void;
}

export const deliverySettings: DeliverySettings = {
  filterSupportedProviders: null,
  load({ sortProviders, filterSupportedProviders = allProviders }) {
    if (sortProviders) {
      logger.warn(
        'sortProviders is deprecated, please specifc filterSupportedProviders instead'
      );
      const filterSortedProviders: FilterProviders = ({ providers }) => {
        return providers
          .sort(sortProviders)
          .map(({ _id }) => dbIdToString(_id));
      };
      this.filterSupportedProviders = filterSortedProviders;
    } else {
      this.filterSupportedProviders = filterSupportedProviders;
    }
  },
};
