import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { InvalidIdError } from '../../../errors';

export default async function warehousingProvider(
  root: Root,
  { warehousingProviderId }: { warehousingProviderId: string },
  { modules, userId }: Context
) {
  log(`query warehousingProvider ${warehousingProviderId}`, { userId });

  if (!warehousingProviderId)
    throw new InvalidIdError({ warehousingProviderId });

  return modules.warehousing.findProvider({
    warehousingProviderId,
  });
}
