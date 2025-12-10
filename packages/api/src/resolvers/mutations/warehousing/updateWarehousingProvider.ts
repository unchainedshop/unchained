import { log } from '@unchainedshop/logger';
import type { Context } from '../../../context.ts';
import type { WarehousingProvider } from '@unchainedshop/core-warehousing';
import { WarehousingProviderNotFoundError, InvalidIdError } from '../../../errors.ts';

export default async function updateWarehousingProvider(
  root: never,
  params: {
    warehousingProvider: WarehousingProvider;
    warehousingProviderId: string;
  },
  { modules, userId }: Context,
) {
  const { warehousingProvider, warehousingProviderId } = params;

  log(`mutation updateWarehousingProvider ${warehousingProviderId}`, {
    userId,
  });

  if (!warehousingProviderId) throw new InvalidIdError({ warehousingProviderId });

  if (!(await modules.warehousing.providerExists({ warehousingProviderId })))
    throw new WarehousingProviderNotFoundError({ warehousingProviderId });

  return modules.warehousing.update(warehousingProviderId, warehousingProvider);
}
