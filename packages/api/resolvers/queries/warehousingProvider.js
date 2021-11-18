import { log } from 'unchained-logger';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';
import { InvalidIdError } from '../../errors';

export default function warehousingProvider(
  root,
  { warehousingProviderId },
  { userId }
) {
  log(`query warehousingProvider ${warehousingProviderId}`, { userId });

  if (!warehousingProviderId)
    throw new InvalidIdError({ warehousingProviderId });
  return WarehousingProviders.findProvider({
    warehousingProviderId,
  });
}
