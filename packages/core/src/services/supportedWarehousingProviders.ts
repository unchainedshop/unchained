import {
  WarehousingContext,
  WarehousingDirector,
  WarehousingModule,
  WarehousingProvider,
} from '@unchainedshop/core-warehousing';

export const supportedWarehousingProvidersService = async (
  params: WarehousingContext,
  unchainedAPI: {
    modules: {
      warehousing: WarehousingModule;
    };
  },
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
