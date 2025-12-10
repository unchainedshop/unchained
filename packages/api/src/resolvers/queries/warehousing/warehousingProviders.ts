import { WarehousingProviderType } from '@unchainedshop/core-warehousing';
import type { Context } from '../../../context.ts';
import { log } from '@unchainedshop/logger';

export default async function warehousingProviders(
  root: never,
  params: {
    type?: WarehousingProviderType | null;
  },
  { modules, userId }: Context,
) {
  log(`query warehousingProviders ${params.type}`, { userId });

  return modules.warehousing.findProviders(
    params.type
      ? {
          type: params.type,
        }
      : {},
  );
}
