import { Context, Root } from '@unchainedshop/types/api';
import { WarehousingProviderType } from '@unchainedshop/types/warehousing';
import { log } from 'meteor/unchained:logger';

export default async function warehousingProviders(
  root: Root,
  params: { type: WarehousingProviderType },
  { modules, userId }: Context
) {
  log(`query warehousingProviders ${params.type}`, { userId });

  return await modules.warehousing.findProviders(params);
}
