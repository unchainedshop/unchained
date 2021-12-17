import { DeliveryProvider } from '@unchainedshop/types/delivery';
import { createLogger } from 'meteor/unchained:logger';

const logger = createLogger('unchained:core-delivery');

const sortByCreationDate = (
  left: DeliveryProvider,
  right: DeliveryProvider
) => {
  return new Date(left.created).getTime() - new Date(right.created).getTime();
};

type filterProviders = (params: {
  providers: Array<DeliveryProvider>;
}) => Array<string>;

const allProviders: filterProviders = ({ providers }) => {
  return providers.sort(sortByCreationDate).map(({ _id }) => _id as string);
};

export const deliverySettings = {
  filterSupportedProviders: null,
  load({
    sortProviders,
    filterSupportedProviders = allProviders,
  }: {
    sortProviders?: (a: DeliveryProvider, b: DeliveryProvider) => number;
    filterSupportedProviders: filterProviders;
  }) {
    if (sortProviders) {
      logger.warn(
        'sortProviders is deprecated, please specifc filterSupportedProviders instead'
      );
      this.filterSupportedProviders = ({ providers }) => {
        return providers.sort(sortProviders).map(({ _id }) => _id);
      };
    } else {
      this.filterSupportedProviders = filterSupportedProviders;
    }
  },
};
