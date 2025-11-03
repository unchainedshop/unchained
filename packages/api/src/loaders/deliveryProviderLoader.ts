import { UnchainedCore } from '@unchainedshop/core';
import { DeliveryProvider } from '@unchainedshop/core-delivery';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ deliveryProviderId: string }, DeliveryProvider>(async (queries) => {
    const deliveryProviderIds = [...new Set(queries.map((q) => q.deliveryProviderId).filter(Boolean))];

    const deliveryProviders = await unchainedAPI.modules.delivery.findProviders({
      _id: { $in: deliveryProviderIds },
      includeDeleted: true,
    });

    const deliveryProviderMap = {};
    for (const deliveryProvider of deliveryProviders) {
      deliveryProviderMap[deliveryProvider._id] = deliveryProvider;
    }

    return queries.map((q) => deliveryProviderMap[q.deliveryProviderId]);
  });
