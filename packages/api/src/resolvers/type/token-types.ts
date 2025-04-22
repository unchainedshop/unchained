import { Context } from '../../context.js';
import { TokenSurrogate, TokenStatus, WarehousingProviderType } from '@unchainedshop/core-warehousing';
import { WorkStatus } from '@unchainedshop/core-worker';
import { checkAction } from '../../acl.js';
import { actions } from '../../roles/index.js';
import { WarehousingDirector } from '@unchainedshop/core';

export const Token = {
  product: async (token: TokenSurrogate, params: never, { loaders }: Context) => {
    return loaders.productLoader.load({ productId: token.productId });
  },

  user: async (token: TokenSurrogate, params: never, { loaders }: Context) => {
    if (!token.userId) return null;
    return loaders.userLoader.load({ userId: token.userId });
  },

  status: async (token: TokenSurrogate, params: never, { modules }: Context) => {
    if (token.walletAddress && !token.userId) {
      return TokenStatus.DECENTRALIZED;
    }
    // TODO: use loader?
    const workItems = await modules.worker.findWorkQueue({
      types: ['EXPORT_TOKEN'],
      status: [WorkStatus.NEW, WorkStatus.ALLOCATED],
    });
    if (workItems.find((item) => item.input?.token?._id === token._id)) return TokenStatus.EXPORTING;
    return TokenStatus.CENTRALIZED;
  },

  ercMetadata: async (
    token: TokenSurrogate,
    { forceLocale }: { forceLocale: string },
    context: Context,
  ) => {
    const { loaders } = context;
    const product = await loaders.productLoader.load({ productId: token.productId });

    // TODO: use loader
    const virtualProviders = await context.modules.warehousing.findProviders({
      type: WarehousingProviderType.VIRTUAL,
    });

    return WarehousingDirector.tokenMetadata(
      virtualProviders,
      {
        product,
        token,
        locale: forceLocale ? new Intl.Locale(forceLocale) : context.localeContext,
        quantity: token?.quantity || 1,
        referenceDate: new Date(),
      },
      context,
    );
  },

  isInvalidateable: async (token: TokenSurrogate, _params: never, context: Context) => {
    const { loaders } = context;
    const product = await loaders.productLoader.load({ productId: token.productId });

    // TODO: use loader
    const virtualProviders = await context.modules.warehousing.findProviders({
      type: WarehousingProviderType.VIRTUAL,
    });

    const isInvalidateable = await WarehousingDirector.isInvalidateable(
      virtualProviders,
      {
        token,
        product,
        quantity: token?.quantity || 1,
        referenceDate: new Date(),
      },
      context,
    );

    return isInvalidateable;
  },

  accessKey: async (token: TokenSurrogate, params: never, requestContext: Context) => {
    const { modules } = requestContext;
    await checkAction(requestContext, actions.updateToken, [undefined, { tokenId: token._id }]);
    // This generates a hash that is stable until ownership is changed and allows accessing token
    // data and operations
    return modules.warehousing.buildAccessKeyForToken(token._id);
  },
};
