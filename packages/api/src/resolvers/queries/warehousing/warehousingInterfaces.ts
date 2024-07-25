import { Context } from '../../../types.js';
import { WarehousingProviderType } from '@unchainedshop/types/warehousing.js';
import { log } from '@unchainedshop/logger';

export default async function warehousingInterfaces(
  root: never,
  params: { type: WarehousingProviderType },
  { modules, userId }: Context,
) {
  log(`query warehousingInterfaces ${params.type}`, { userId });

  return modules.warehousing.findInterfaces(params);
}
