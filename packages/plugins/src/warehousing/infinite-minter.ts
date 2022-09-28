import {
  WarehousingDirector,
  WarehousingAdapter,
  WarehousingProviderType,
} from '@unchainedshop/core-warehousing';
import { ProductType } from '@unchainedshop/types/products';
import { IWarehousingAdapter } from '@unchainedshop/types/warehousing';

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

        const chainId = configuration.find(({ key }) => key === 'chainId');

        return [
          {
            chainTokenId: product.tokenization.tokenId,
            contractAddress: product.tokenization.contractAddress,
            quantity: orderPosition.quantity,
            chainId: chainId?.value || '0',
            meta: {},
          },
        ];
      },
    };
  },
};

WarehousingDirector.registerAdapter(ETHMinter);
