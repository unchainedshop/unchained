import { Context } from '@unchainedshop/types/api';
import { Product } from '@unchainedshop/types/products';
import { User } from '@unchainedshop/types/user';
import { TokenStatus, TokenSurrogate } from '@unchainedshop/types/warehousing';
import { WorkStatus } from '@unchainedshop/types/worker';
import localePkg from 'locale';

const { Locale } = localePkg;

type HelperType<T> = (root: TokenSurrogate, params: never, context: Context) => Promise<T>;

export interface TokenHelperTypes {
  product: HelperType<Product>;
  status: HelperType<TokenStatus>;
  ercMetadata: (
    root: TokenSurrogate,
    params: { forceLocale?: string },
    context: Context,
  ) => Promise<any>;
  user: HelperType<User>;
}

export const Token: TokenHelperTypes = {
  product: async (token, _params, { modules }) => {
    return modules.products.findProduct({ productId: token.productId });
  },

  user: async (token, _params, { modules }) => {
    if (!token.userId) return null;
    return modules.users.findUserById(token.userId);
  },

  status: async (token, _params, { modules }) => {
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

  ercMetadata: async (token, { forceLocale }, context) => {
    const { modules } = context;
    const product = await modules.products.findProduct({ productId: token.productId });
    const ercMetadata = await modules.warehousing.tokenMetadata(
      token.chainTokenId,
      {
        token,
        product,
        referenceDate: new Date(),
      },
      { ...context, localeContext: new Locale(forceLocale) },
    );

    return ercMetadata;
  },
};
