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

  // A token can outlive its order's ownership (web3 transfer, ticket handed on), so the order is
  // guarded by viewOrder on its own and resolves to null instead of failing the whole token.
  order: async (token: TokenSurrogate, _params: never, context: Context) => {
    if (!token.orderPositionId) return null;
    const orderPosition = await context.modules.orders.positions.findOrderPosition(
      { itemId: token.orderPositionId },
      { projection: { orderId: 1 } },
    );
    if (!orderPosition?.orderId) return null;

    const params = { orderId: orderPosition.orderId };
    if (!(await context.roles!.userHasPermission(context, actions.viewOrder, [undefined, params])))
      return null;
    return context.loaders.orderLoader.load(params);
  },

  status: async (token: TokenSurrogate, params: never, { loaders }: Context) => {
    return loaders.tokenExportStatusLoader.load({ token });
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

  isInvalidateable: async (token: TokenSurrogate, _params: never, { loaders, services }: Context) => {
    const product = await loaders.productLoader.load({ productId: token.productId });
    return services.warehousing.isTokenInvalidateable({ token, product });
  },

  accessKey: async (token: TokenSurrogate, params: never, requestContext: Context) => {
    const { modules } = requestContext;
    await checkAction(requestContext, actions.updateToken, [undefined, { tokenId: token._id }]);
    // This generates a hash that is stable until ownership is changed and allows accessing token
    // data and operations
    return modules.warehousing.buildAccessKeyFromToken(token);
  },
};
