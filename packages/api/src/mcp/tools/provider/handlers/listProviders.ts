import type { Context } from '../../../../context.ts';
import { getProviderConfig } from '../utils/getProviderConfig.ts';
import type { Params } from '../schemas.ts';

export default async function listProviders(context: Context, params: Params<'LIST'>) {
  const { providerType, typeFilter, queryString } = params;
  const config = getProviderConfig(context, providerType);

  const providers = await config.module.findProviders({
    type: typeFilter,
    queryString,
  });
  return { providers };
}
