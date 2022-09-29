import {
  WarehousingDirector,
  WarehousingAdapter,
  WarehousingProviderType,
} from '@unchainedshop/core-warehousing';
import { ProductType } from '@unchainedshop/types/products';
import { IWarehousingAdapter, TokenSurrogate } from '@unchainedshop/types/warehousing';
import { generateDbObjectId } from '@unchainedshop/utils';

const ETHMinter: IWarehousingAdapter = {
  ...WarehousingAdapter,

  key: 'shop.unchained.warehousing.infinite-minter',
  version: '1.0',
  label: 'Infinite Minter',
  orderIndex: 0,

  initialConfiguration: [{ key: 'chainId', value: '0' }],

  typeSupported: (type) => {
    return type === WarehousingProviderType.VIRTUAL;
  },

  actions: (configuration, context) => {
    const { product, orderPosition } = context;
    return {
      ...WarehousingAdapter.actions(configuration, context),

      isActive() {
        return product?.type === ProductType.TokenizedProduct;
      },

      configurationError() {
        return null;
      },

      stock: async () => {
        return product.tokenization.supply;
      },

      tokenize: async () => {
        // Upload Image to IPFS
        // Upload Metadata to IPFS
        // Store Metadata in Collection

        const chainId = configuration.find(({ key }) => key === 'chainId')?.value || '0';
        const { contractAddress, tokenId: chainTokenId } = product.tokenization;
        const _id = generateDbObjectId();
        const meta = {};

        return [
          {
            _id,
            chainTokenId,
            contractAddress,
            quantity: orderPosition.quantity,
            chainId,
            meta,
          } as TokenSurrogate,
        ];
      },
    };
  },
};

WarehousingDirector.registerAdapter(ETHMinter);
