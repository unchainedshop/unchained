import { WarehousingProviderType } from '@unchainedshop/core-warehousing';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';

export default async function warehousingProviders(
  root: never,
  params: {
    type?: WarehousingProviderType;
  },
  { modules, userId }: Context,
) {
  log(`query warehousingProviders ${params.type}`, { userId });

  return modules.warehousing.findProviders(params);
}
