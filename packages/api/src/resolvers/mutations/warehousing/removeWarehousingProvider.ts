import { Context, Root } from '@unchainedshop/types/api';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, WarehousingProviderNotFoundError } from '../../../errors';

export default async function removeWarehousingProvider(
  root: Root,
  { warehousingProviderId }: { warehousingProviderId: string },
  { modules, userId }: Context,
) {
  log(`mutation removeWarehousingProvider ${warehousingProviderId}`, {
    userId,
  });

  if (!warehousingProviderId) throw new InvalidIdError({ warehousingProviderId });

  const provider = await modules.warehousing.findProvider({
    warehousingProviderId,
  });
  if (!provider) throw new WarehousingProviderNotFoundError({ warehousingProviderId });

  return modules.warehousing.delete(warehousingProviderId);
}
