import { Context } from '@unchainedshop/types/api';
import { Product } from '@unchainedshop/types/products';
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
}

export const Token: TokenHelperTypes = {
  product: async (token, _params, { modules }) => {
    return modules.products.findProduct({ productId: token.productId });
  },

  status: async (token, _params, { modules }) => {
    if (token.lastWalletAddress && !token.userId) {
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
