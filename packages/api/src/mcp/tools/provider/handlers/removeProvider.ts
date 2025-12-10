import type { Context } from '../../../../context.ts';
import { getProviderConfig } from '../utils/getProviderConfig.ts';
import type { Params } from '../schemas.ts';

export default async function removeProvider(context: Context, params: Params<'REMOVE'>) {
  const { providerType, providerId } = params;
  const config = getProviderConfig(context, providerType);
  const existing = await config.module.findProvider({ [config.idField]: providerId });

  if (!existing) throw new config.NotFoundError({ [config.idField]: providerId });

  await config.module.delete(providerId);
  return { provider: existing };
}
