import type { Context } from '../../../../context.ts';
import { getProviderConfig } from '../utils/getProviderConfig.ts';
import type { Params } from '../schemas.ts';

export default async function getProviderInterfaces(context: Context, params: Params<'INTERFACES'>) {
  const { providerType, typeFilter } = params;
  const config = getProviderConfig(context, providerType);
  let allAdapters = config.director.getAdapters();

  if (typeFilter) {
    allAdapters = allAdapters.filter((adapter: any) => adapter.typeSupported(typeFilter));
  }

  const interfaces = allAdapters.map((Adapter: any) => ({
    adapterKey: Adapter.key,
    label: Adapter.label,
    version: Adapter.version,
  }));

  return {
    interfaces,
    providerType,
    typeFilter: typeFilter || null,
  };
}
