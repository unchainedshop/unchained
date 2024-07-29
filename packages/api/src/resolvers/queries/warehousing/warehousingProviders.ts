import { Context } from '../../../types.js';
import { WarehousingProviderQuery } from '@unchainedshop/core-warehousing';
import { log } from '@unchainedshop/logger';

export default async function warehousingProviders(
  root: never,
  params: WarehousingProviderQuery,
  { modules, userId }: Context,
) {
  log(`query warehousingProviders ${params.type}`, { userId });

  return modules.warehousing.findProviders(params);
}
