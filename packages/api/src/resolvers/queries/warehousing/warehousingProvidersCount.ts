import { Context, Root } from '@unchainedshop/types/api';
import { WarehousingProviderQuery } from '@unchainedshop/types/warehousing';
import { log } from 'meteor/unchained:logger';

export default async function warehousingProvidersCount(
  root: Root,
  params: WarehousingProviderQuery,
  { modules, userId }: Context,
) {
  log(`query warehousingProvidersCount ${params.type}`, { userId });

  return modules.warehousing.count(params);
}
