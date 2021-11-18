import { log } from 'unchained-logger';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';
import { WarehousingProviderNotFoundError, InvalidIdError } from '../../errors';

export default (
  root,
  { warehousingProvider, warehousingProviderId },
  { userId }
) => {
  log(`mutation updateWarehousingProvider ${warehousingProviderId}`, {
    userId,
  });
  if (!warehousingProviderId)
    throw new InvalidIdError({ warehousingProviderId });
  if (
    !WarehousingProviders.providerExists({
      warehousingProviderId,
    })
  )
    throw new WarehousingProviderNotFoundError({ warehousingProviderId });

  return WarehousingProviders.updateProvider({
    _id: warehousingProviderId,
    ...warehousingProvider,
  });
};
