import type { UnchainedCore } from '@unchainedshop/core';
import type { WarehousingProvider } from '@unchainedshop/core-warehousing';
import DataLoader from 'dataloader';

export default (unchainedAPI: UnchainedCore) =>
  new DataLoader<{ warehousingProviderId: string }, WarehousingProvider>(async (queries) => {
    const warehousingProviderIds = [
      ...new Set(queries.map((q) => q.warehousingProviderId).filter(Boolean)),
    ];

    const warehousingProviders = await unchainedAPI.modules.warehousing.findProviders({
      warehousingProviderIds,
      includeDeleted: true,
    });

    const warehousingProviderMap = {};
    for (const warehousingProvider of warehousingProviders) {
      warehousingProviderMap[warehousingProvider._id] = warehousingProvider;
    }

    return queries.map((q) => warehousingProviderMap[q.warehousingProviderId]);
  });
