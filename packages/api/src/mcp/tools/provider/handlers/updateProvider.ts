import type { Context } from '../../../../context.ts';
import { getProviderConfig } from '../utils/getProviderConfig.ts';
import type { Params } from '../schemas.ts';

export default async function updateProvider(context: Context, params: Params<'UPDATE'>) {
  const { providerType, providerId, configuration } = params;

  const validConfiguration = configuration.filter((c): c is { key: string; value: any } =>
    Boolean(c.key && c.value !== undefined),
  );

  if (validConfiguration.length === 0) {
    throw new Error('At least one valid configuration entry with key and value is required');
  }

  const config = getProviderConfig(context, providerType);
  const existsParam = { [config.idField]: providerId };

  if (providerType === 'PAYMENT') {
    if (!(await config.module.providerExists(existsParam))) {
      throw new config.NotFoundError(existsParam);
    }
  } else {
    const existing = await config.module.findProvider(existsParam);
    if (!existing) throw new config.NotFoundError(existsParam);
  }

  const updated = await config.module.update(providerId, { configuration: validConfiguration } as any);
  return { provider: updated };
}
