import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';
import {
  WarehousingProviderNotFoundError,
  InvalidIdError,
} from '../../../errors';
import { WarehousingProvider } from '@unchainedshop/types/warehousing';

export default async function updateWarehousingProvider(
  root: Root,
  params: {
    warehousingProvider: WarehousingProvider;
    warehousingProviderId: string;
  },
  { modules, userId }: Context
) {
  const { warehousingProvider, warehousingProviderId } = params;

  log(`mutation updateWarehousingProvider ${warehousingProviderId}`, {
    userId,
  });

  if (!warehousingProviderId)
    throw new InvalidIdError({ warehousingProviderId });

  if (!(await modules.warehousing.providerExists({ warehousingProviderId })))
    throw new WarehousingProviderNotFoundError({ warehousingProviderId });

  await modules.warehousing.update(
    warehousingProviderId,
    warehousingProvider,
    userId
  );

  return await modules.warehousing.findProvider({ warehousingProviderId })
}
