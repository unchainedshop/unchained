import { WarehousingProvider } from '@unchainedshop/core-warehousing';
import { WarehousingContext, WarehousingDirector } from '../directors/index.js';
import { Modules } from '../modules.js';

export async function supportedWarehousingProvidersService(this: Modules, params: WarehousingContext) {
  const allProviders = await this.warehousing.findProviders({});

  const providers = (
    await Promise.all(
      allProviders.map(async (provider: WarehousingProvider) => {
        const adapter = await WarehousingDirector.actions(provider, params, { modules: this });
        return adapter.isActive() ? [provider] : [];
      }),
    )
  ).flat();

  return providers;
}
