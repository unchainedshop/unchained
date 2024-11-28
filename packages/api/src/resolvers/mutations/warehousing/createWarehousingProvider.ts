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

  const warehousingProvider = await modules.warehousing.create({
    ...params.warehousingProvider,
  });

  if (!warehousingProvider) throw new ProviderConfigurationInvalid(params.warehousingProvider);

  return modules.warehousing.findProvider({ warehousingProviderId: warehousingProvider._id });
}
