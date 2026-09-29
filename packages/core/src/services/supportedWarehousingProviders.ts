import type { WarehousingProvider } from '@unchainedshop/core-warehousing';
import { createLogger } from '@unchainedshop/logger';
import { type WarehousingContext, WarehousingDirector } from '../directors/index.ts';
import type { Modules } from '../modules.ts';

const logger = createLogger('unchained:core');

export async function supportedWarehousingProvidersService(this: Modules, params: WarehousingContext) {
  const allProviders = await this.warehousing.allProviders();

  const providers = (
    await Promise.all(
      allProviders.map(async (provider: WarehousingProvider) => {
        // A provider whose plugin is not registered (removed, renamed or not deployed yet)
        // must not break every cart, so it counts as inactive
        if (!WarehousingDirector.getAdapter(provider.adapterKey)) {
          logger.warn('Warehousing provider skipped, its adapter is not registered', {
            warehousingProviderId: provider._id,
            adapterKey: provider.adapterKey,
          });
          return [];
        }
        const adapter = await WarehousingDirector.actions(provider, params, { modules: this });
        return adapter.isActive() ? [provider] : [];
      }),
    )
  ).flat();

  return providers;
}
