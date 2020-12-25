import { log } from 'meteor/unchained:core-logger';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';
import { WarehousingProviderNotFoundError, InvalidIdError } from '../../errors';

export default function warehousingProvider(
  root,
  { warehousingProviderId },
  { userId }
) {
  log(`query warehousingProvider ${warehousingProviderId}`, { userId });
  if (!warehousingProviderId)
    throw new InvalidIdError({ warehousingProviderId });
  const foundWarehousingProvider = WarehousingProviders.findProviderById(
    warehousingProviderId
  );
  if (!foundWarehousingProvider)
    throw new WarehousingProviderNotFoundError({ warehousingProviderId });

  return foundWarehousingProvider;
}
