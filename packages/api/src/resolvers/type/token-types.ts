import { Context } from '@unchainedshop/types/api';
import { Product } from '@unchainedshop/types/products';
import { User } from '@unchainedshop/types/user';
import { TokenSurrogate } from '@unchainedshop/types/warehousing';
import { WorkStatus } from '@unchainedshop/types/worker';

type HelperType<T> = (root: TokenSurrogate, params: never, context: Context) => Promise<T>;

export enum TokenExportStatus {
  CENTRALIZED = 'CENTRALIZED',
  EXPORTING = 'EXPORTING',
  DECENTRALIZED = 'DECENTRALIZED',
}

export interface TokenHelperTypes {
  product: HelperType<Product>;
  status: HelperType<TokenExportStatus>;
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
      return TokenExportStatus.DECENTRALIZED;
    }
    const workItems = await modules.worker.findWorkQueue({
      types: ['EXPORT_TOKEN'],
      status: [WorkStatus.NEW, WorkStatus.ALLOCATED],
    });
    if (workItems.find((item) => item.input?.token?._id === token._id))
      return TokenExportStatus.EXPORTING;
    return TokenExportStatus.CENTRALIZED;
  },
};
