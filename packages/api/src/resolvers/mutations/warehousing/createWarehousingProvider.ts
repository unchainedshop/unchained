import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';
import { WarehousingProvider } from '@unchainedshop/types/warehousing';
import { ProviderConfigurationInvalid } from '../../../errors';

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
