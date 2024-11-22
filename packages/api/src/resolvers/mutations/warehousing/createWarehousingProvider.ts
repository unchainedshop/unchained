import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { WarehousingProvider } from '@unchainedshop/core-warehousing';
import { ProviderConfigurationInvalid } from '../../../errors.js';

export default async function createWarehousingProvider(
  root: never,
  params: { warehousingProvider: WarehousingProvider },
  { modules, userId }: Context,
) {
  log('mutation createWarehousingProvider', { userId });

  const warehousingProviderId = await modules.warehousing.create({
    ...params.warehousingProvider,
  });

  if (!warehousingProviderId) throw new ProviderConfigurationInvalid(params.warehousingProvider);

  return modules.warehousing.findProvider({ warehousingProviderId });
}
