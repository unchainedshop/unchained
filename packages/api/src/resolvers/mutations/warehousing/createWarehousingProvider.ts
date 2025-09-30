import { log } from '@unchainedshop/logger';
import { Context } from '../../../context.js';
import { WarehousingProvider } from '@unchainedshop/core-warehousing';
import { ProviderConfigurationInvalid } from '../../../errors.js';
import { WarehousingDirector } from '@unchainedshop/core';

export default async function createWarehousingProvider(
  root: never,
  { warehousingProvider }: { warehousingProvider: Pick<WarehousingProvider, 'type' | 'adapterKey'> },
  { modules, userId }: Context,
) {
  log('mutation createWarehousingProvider', { userId });

  const Adapter = WarehousingDirector.getAdapter(warehousingProvider.adapterKey);
  if (!Adapter) return null;

  const warehousingProviderObj = await modules.warehousing.create({
    configuration: Adapter.initialConfiguration,
    ...warehousingProvider,
  });

  if (!warehousingProviderObj) throw new ProviderConfigurationInvalid(warehousingProvider);

  return modules.warehousing.findProvider({ warehousingProviderId: warehousingProviderObj._id });
}
