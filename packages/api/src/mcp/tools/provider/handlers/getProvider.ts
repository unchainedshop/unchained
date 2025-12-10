import type { Context } from '../../../../context.ts';
import { getProviderConfig } from '../utils/getProviderConfig.ts';
import type { Params } from '../schemas.ts';

export default async function getProvider(context: Context, params: Params<'GET'>) {
  const { providerType, providerId } = params;
  const config = getProviderConfig(context, providerType);
  const provider = await config.module.findProvider({ [config.idField]: providerId });

  if (!provider) {
    return {
      provider: null,
      message: `${providerType.toLowerCase()} provider not found for ID: ${providerId}`,
    };
  }

  return { provider };
}
