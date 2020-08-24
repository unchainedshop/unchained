import { log } from 'meteor/unchained:core-logger';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';

export default function warehousingProvider(
  root,
  { warehousingProviderId },
  { userId },
) {
  log(`query warehousingProvider ${warehousingProviderId}`, { userId });
  return WarehousingProviders.findProviderById(warehousingProviderId);
}
