import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import { ProviderConfigurationInvalid } from '../../../errors';
import { WarehousingProvider } from '@unchainedshop/types/warehousing';

export default async function createWarehousingProvider (
  root: Root,
  params: { warehousingProvider: WarehousingProvider },
  { modules, userId }: Context
) {
  log('mutation createWarehousingProvider', { userId });

  const warehousingProviderId = await modules.warehousing.create({
    ...params.warehousingProvider,
    authorId: userId,
  }, userId);

  if (!warehousingProviderId)
    throw new ProviderConfigurationInvalid(params.warehousingProvider);

  return await modules.warehousing.findProvider({ warehousingProviderId });
};
