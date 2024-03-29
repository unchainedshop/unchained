import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { WarehousingProvider } from '@unchainedshop/types/warehousing.js';
import { ProviderConfigurationInvalid } from '../../../errors.js';

export default async function createWarehousingProvider(
  root: Root,
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
