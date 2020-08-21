import { log } from 'meteor/unchained:core-logger';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';
import { WarehousingProviderNotFoundError, InvalidIdError } from '../../errors';

export default function (root, { warehousingProviderId }, { userId }) {
  log(`query warehousing-provider ${warehousingProviderId}`, { userId });

  if (!warehousingProviderId)
    throw new InvalidIdError({ warehousingProviderId });

  const warehousingProvider = WarehousingProviders.findProviderById(
    warehousingProviderId,
  );
  if (!warehousingProvider)
    throw new WarehousingProviderNotFoundError({ warehousingProviderId });

  return warehousingProvider;
}
