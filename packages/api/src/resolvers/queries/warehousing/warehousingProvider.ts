import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import { InvalidIdError } from '../../../errors.ts';

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
