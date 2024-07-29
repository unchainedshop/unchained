import { Context } from '../../../types.js';
import { WarehousingProviderQuery } from '@unchainedshop/core-warehousing';
import { log } from '@unchainedshop/logger';

export default async function warehousingProvidersCount(
  root: never,
  params: WarehousingProviderQuery,
  { modules, userId }: Context,
) {
  log(`query warehousingProvidersCount ${params.type}`, { userId });

  return modules.warehousing.count(params);
}
