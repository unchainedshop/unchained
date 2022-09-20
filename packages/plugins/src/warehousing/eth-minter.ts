import {
  WarehousingDirector,
  WarehousingAdapter,
  WarehousingProviderType,
} from '@unchainedshop/core-warehousing';
import { ProductType } from '@unchainedshop/types/products';
import { IWarehousingAdapter } from '@unchainedshop/types/warehousing';

const ETHMinter: IWarehousingAdapter = {
  ...WarehousingAdapter,

  key: 'shop.unchained.warehousing.eth-minter',
  version: '1.0',
  label: 'Ethereum Minter',
  orderIndex: 0,

  initialConfiguration: [{ key: 'tokenURI', value: '' }],

  typeSupported: (type) => {
    return type === WarehousingProviderType.VIRTUAL;
  },

  actions: (configuration, { product }) => {
    return {
      isActive() {
        return product?.type === ProductType.TokenizedProduct;
      },

      configurationError() {
        return null;
      },

      stock: async () => {
        return 99999;
      },

      productionTime: async () => {
        return 0;
      },

      commissioningTime: async () => {
        return 0;
      },

      tokenize: async () => {
        // Upload Image to IPFS
        // Upload Metadata to IPFS
        // Store Metadata in Collection

        console.log('TOKENIZE', product);
      },
    };
  },
};

WarehousingDirector.registerAdapter(ETHMinter);
