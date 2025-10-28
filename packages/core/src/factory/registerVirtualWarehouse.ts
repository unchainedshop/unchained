import {
  TokenSurrogate,
  WarehousingConfiguration,
  WarehousingProviderType,
} from '@unchainedshop/core-warehousing';
import { WarehousingAdapter, WarehousingContext, WarehousingDirector } from '../core-index.js';

export default function registerVirtualWarehouse<Metadata = Record<string, any>>({
  adapterId,
  orderIndex = 0,
  stock,
  tokenize,
  tokenMetadata,
  isInvalidateable,
}: {
  adapterId: string;
  orderIndex?: number;
  stock?:
    | number
    | ((
        referenceDate: Date,
        configuration: WarehousingConfiguration,
        context: WarehousingContext,
      ) => Promise<number>);

  tokenize: (
    configuration: WarehousingConfiguration,
    context: WarehousingContext,
  ) => Promise<Omit<TokenSurrogate, 'userId' | 'productId' | 'orderPositionId'>[]>;

  tokenMetadata?: (
    serialNumber: string,
    referenceDate: Date,
    configuration: WarehousingConfiguration,
    context: WarehousingContext,
  ) => Promise<Metadata>;

  isInvalidateable?: (
    serialNumber: string,
    referenceDate: Date,
    configuration: WarehousingConfiguration,
    context: WarehousingContext,
  ) => Promise<boolean>;
}) {
  WarehousingDirector.registerAdapter({
    ...WarehousingAdapter,

    key: 'shop.unchained.warehousing.virtual.' + adapterId,
    label: 'Store',
    version: '1.0.0',
    orderIndex,

    initialConfiguration: [{ key: 'shipping-hub', value: 'Shipping Hub' }],

    typeSupported: (type) => {
      return type === WarehousingProviderType.VIRTUAL;
    },

    actions: (configuration, context) => {
      return {
        ...WarehousingAdapter.actions(configuration, context),

        isActive() {
          return true;
        },

        configurationError() {
          return null;
        },

        stock: async (referenceDate) => {
          if (typeof stock === 'number') {
            return stock;
          } else if (typeof stock === 'function') {
            return stock(referenceDate, configuration, context);
          }
          return 99999;
        },

        async tokenize() {
          return tokenize(configuration, context);
        },

        async tokenMetadata(serialNumber, referenceDate) {
          if (tokenMetadata) {
            return tokenMetadata(serialNumber, referenceDate, configuration, context);
          }
          return null;
        },

        async isInvalidateable(serialNumber, referenceDate) {
          if (isInvalidateable) {
            return isInvalidateable(serialNumber, referenceDate, configuration, context);
          }
          return false;
        },
      };
    },
  });
}
