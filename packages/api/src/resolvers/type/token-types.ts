import type { Context } from '../../context.ts';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';
import { checkAction } from '../../acl.ts';
import { actions } from '../../roles/index.ts';

export const Token = {
  product: async (token: TokenSurrogate, params: never, { loaders }: Context) => {
    return loaders.productLoader.load({ productId: token.productId });
  },

  user: async (token: TokenSurrogate, params: never, { loaders }: Context) => {
    if (!token.userId) return null;
    return loaders.userLoader.load({ userId: token.userId });
  },

  status: async (token: TokenSurrogate, params: never, { services }: Context) => {
    return services.warehousing.resolveTokenStatus({ token });
  },

  ercMetadata: async (
    token: TokenSurrogate,
    { forceLocale }: { forceLocale: string },
    context: Context,
  ) => {
    const { loaders, services } = context;
    const product = await loaders.productLoader.load({ productId: token.productId });

    return services.warehousing.ercMetadata({
      product,
      token,
      locale: forceLocale ? new Intl.Locale(forceLocale) : context.locale,
    });
  },

  isInvalidateable: async (token: TokenSurrogate, _params: never, { services }: Context) => {
    return services.warehousing.isTokenInvalidateable({ token });
  },

  accessKey: async (token: TokenSurrogate, params: never, requestContext: Context) => {
    const { modules } = requestContext;
    await checkAction(requestContext, actions.updateToken, [undefined, { tokenId: token._id }]);
    // This generates a hash that is stable until ownership is changed and allows accessing token
    // data and operations
    return modules.warehousing.buildAccessKeyForToken(token._id);
  },
};
