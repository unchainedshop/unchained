import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { InvalidIdError } from '../../../errors.js';

export default async function warehousingProvider(
  root: Root,
  { warehousingProviderId }: { warehousingProviderId: string },
  { modules, userId }: Context,
) {
  log(`query warehousingProvider ${warehousingProviderId}`, { userId });

  if (!warehousingProviderId) throw new InvalidIdError({ warehousingProviderId });

  return modules.warehousing.findProvider({
    warehousingProviderId,
  });
}
