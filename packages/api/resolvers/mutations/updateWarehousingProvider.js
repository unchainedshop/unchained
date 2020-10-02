import { log } from 'meteor/unchained:core-logger';
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
  const provider = WarehousingProviders.findOne({
    _id: warehousingProviderId,
    deleted: null,
  });
  if (!provider)
    throw new WarehousingProviderNotFoundError({ warehousingProviderId });

  return WarehousingProviders.updateProvider({
    _id: warehousingProviderId,
    ...warehousingProvider,
  });
};
