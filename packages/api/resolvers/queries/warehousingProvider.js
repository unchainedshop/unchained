import { log } from 'meteor/unchained:core-logger';
import { WarehousingProviders } from 'meteor/unchained:core-warehousing';

export default function (root, { warehousingProviderId }, { userId }) {
  log(`query warehousing-provider ${warehousingProviderId}`, { userId });
  const selector = { };
  selector._id = warehousingProviderId;
  const warehousingProvider = WarehousingProviders.findOne(selector);
  return warehousingProvider;
}
