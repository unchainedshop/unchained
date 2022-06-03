import { Context, Root } from '@unchainedshop/types/api';
import { WarehousingProviderQuery } from '@unchainedshop/types/warehousing';
import { log } from 'meteor/unchained:logger';

export default async function warehousingProviders(
  root: Root,
  params: WarehousingProviderQuery,
  { modules, userId }: Context,
) {
  log(`query warehousingProviders ${params.type}`, { userId });

  return modules.warehousing.findProviders(params);
}
