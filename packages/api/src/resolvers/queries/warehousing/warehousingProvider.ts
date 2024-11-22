import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { InvalidIdError } from '../../../errors.js';

export default async function warehousingProvider(
  root: never,
  { warehousingProviderId }: { warehousingProviderId: string },
  { modules, userId }: Context,
) {
  log(`query warehousingProvider ${warehousingProviderId}`, { userId });

  if (!warehousingProviderId) throw new InvalidIdError({ warehousingProviderId });

  return modules.warehousing.findProvider({
    warehousingProviderId,
  });
}
