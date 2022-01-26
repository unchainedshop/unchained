import { Context, Root } from '@unchainedshop/types/api';
import { WarehousingProviderType } from '@unchainedshop/types/warehousing';
import { log } from 'meteor/unchained:logger';

export default async function warehousingProvidersCount(
  root: Root,
  params: { type: WarehousingProviderType },
  { modules, userId }: Context
) {
  log(`query warehousingProvidersCount ${params.type}`, { userId });

  return modules.warehousing.count(params);
}
