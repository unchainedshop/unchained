import { Context, Root } from '@unchainedshop/types/api';
import { WarehousingProviderType } from '@unchainedshop/types/warehousing';
import { log } from '@unchainedshop/logger';

export default async function warehousingInterfaces(
  root: Root,
  params: { type: WarehousingProviderType },
  { modules, userId }: Context,
) {
  log(`query warehousingInterfaces ${params.type}`, { userId });

  return modules.warehousing.findInterfaces(params);
}
