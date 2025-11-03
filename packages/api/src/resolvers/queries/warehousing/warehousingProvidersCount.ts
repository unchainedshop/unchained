import { Context } from '../../../context.js';
import { WarehousingProviderType } from '@unchainedshop/core-warehousing';
import { log } from '@unchainedshop/logger';

export default async function warehousingProvidersCount(
  root: never,
  params: {
    type?: WarehousingProviderType | null;
  },
  { modules, userId }: Context,
) {
  log(`query warehousingProvidersCount ${params.type}`, { userId });

  return modules.warehousing.count(
    params.type
      ? {
          type: params.type,
        }
      : {},
  );
}
