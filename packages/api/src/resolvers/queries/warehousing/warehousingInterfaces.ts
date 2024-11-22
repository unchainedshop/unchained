import { Context } from '../../../context.js';
import { WarehousingProviderType } from '@unchainedshop/core-warehousing';
import { log } from '@unchainedshop/logger';

export default async function warehousingInterfaces(
  root: never,
  params: { type: WarehousingProviderType },
  { modules, userId }: Context,
) {
  log(`query warehousingInterfaces ${params.type}`, { userId });

  return modules.warehousing.findInterfaces(params);
}
