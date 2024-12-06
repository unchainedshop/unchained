import {
  WarehousingContext,
  WarehousingDirector,
  WarehousingProvider,
} from '@unchainedshop/core-warehousing';
import { Modules } from '../modules.js';

export const supportedWarehousingProvidersService = async (
  params: WarehousingContext,
  unchainedAPI: { modules: Modules },
) => {
  const allProviders = await unchainedAPI.modules.warehousing.findProviders({});

  const providers = (
    await Promise.all(
      allProviders.map(async (provider: WarehousingProvider) => {
        const adapter = await WarehousingDirector.actions(provider, params, unchainedAPI);
        return adapter.isActive() ? [provider] : [];
      }),
    )
  ).flat();

  return providers;
};
