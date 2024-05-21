import { Context } from '@unchainedshop/types/api.js';
import { TokenStatus, TokenSurrogate } from '@unchainedshop/types/warehousing.js';
import { WorkStatus } from '@unchainedshop/types/worker.js';
import localePkg from 'locale';

const { Locale } = localePkg;

export const Token = {
  product: async (token: TokenSurrogate, params: never, { modules }: Context) => {
    return modules.products.findProduct({ productId: token.productId });
  },

  user: async (token: TokenSurrogate, params: never, { modules }: Context) => {
    if (!token.userId) return null;
    return modules.users.findUserById(token.userId);
  },

  status: async (token: TokenSurrogate, params: never, { modules }: Context) => {
    if (token.walletAddress && !token.userId) {
      return TokenStatus.DECENTRALIZED;
    }
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
    const { modules } = context;
    const product = await modules.products.findProduct({ productId: token.productId });
    const ercMetadata = await modules.warehousing.tokenMetadata(
      token.chainTokenId,
      {
        token,
        product,
        locale: new Locale(forceLocale),
        referenceDate: new Date(),
      },
      context,
    );

    return ercMetadata;
  },

  isInvalidateable: async (token: TokenSurrogate, _params: never, context: Context) => {
    const { modules } = context;
    const product = await modules.products.findProduct({ productId: token.productId });
    const isInvalidateable = await modules.warehousing.isInvalidateable(
      token.chainTokenId,
      {
        token,
        product,
        referenceDate: new Date(),
      },
      context,
    );

    return isInvalidateable;
  },
};
