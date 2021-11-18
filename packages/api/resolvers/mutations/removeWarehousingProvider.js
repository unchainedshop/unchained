import { log } from 'unchained-logger';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';
import { InvalidIdError, WarehousingProviderNotFoundError } from '../../errors';

export default (root, { warehousingProviderId }, { userId }) => {
  log(`mutation removeWarehousingProvider ${warehousingProviderId}`, {
    userId,
  });
  if (!warehousingProviderId)
    throw new InvalidIdError({ warehousingProviderId });
  const provider = WarehousingProviders.removeProvider({
    _id: warehousingProviderId,
  });

  if (!provider)
    throw new WarehousingProviderNotFoundError({ warehousingProviderId });

  return provider;
};
