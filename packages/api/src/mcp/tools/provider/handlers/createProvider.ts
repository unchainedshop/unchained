import { Context } from '../../../../context.js';
import { ProviderConfigurationInvalid } from '../../../../errors.js';
import { getProviderConfig } from '../utils/getProviderConfig.js';
import { Params } from '../schemas.js';

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
