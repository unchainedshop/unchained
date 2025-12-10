import type { Context } from '../../../../context.ts';
import { ProviderConfigurationInvalid } from '../../../../errors.ts';
import { getProviderConfig } from '../utils/getProviderConfig.ts';
import type { Params } from '../schemas.ts';

export default async function createProvider(context: Context, params: Params<'CREATE'>) {
  const { providerType, provider } = params;
  const config = getProviderConfig(context, providerType);
  const Adapter = config.director.getAdapter(provider.adapterKey);

  if (!Adapter) throw new ProviderConfigurationInvalid(provider);

  const created = await config.module.create({
    configuration: Adapter.initialConfiguration,
    ...provider,
  } as any);

  if (!created) throw new ProviderConfigurationInvalid(provider);

  return { provider: created };
}
