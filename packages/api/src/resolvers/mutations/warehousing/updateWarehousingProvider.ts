import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { WarehousingProvider } from '@unchainedshop/core-warehousing';
import { WarehousingProviderNotFoundError, InvalidIdError } from '../../../errors.js';

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

  await modules.warehousing.update(warehousingProviderId, warehousingProvider);

  return modules.warehousing.findProvider({ warehousingProviderId });
}
