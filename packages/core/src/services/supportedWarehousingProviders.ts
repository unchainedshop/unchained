import type { WarehousingProvider } from '@unchainedshop/core-warehousing';
import { type WarehousingContext, WarehousingDirector } from '../directors/index.ts';
import type { Modules } from '../modules.ts';

export async function supportedWarehousingProvidersService(this: Modules, params: WarehousingContext) {
  const allProviders = await this.warehousing.allProviders();

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
