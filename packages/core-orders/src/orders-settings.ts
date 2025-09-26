import { generateRandomHash } from '@unchainedshop/utils';
import { Order } from './db/OrdersCollection.js';

export interface OrderSettingsOrderPositionValidation<Product = unknown> {
  order: Order;
  product: Product;
  quantityDiff?: number;
  configuration?: { key: string; value: string }[];
}

export interface OrdersSettings {
  ensureUserHasCart: boolean;
  orderNumberHashFn: (order: Order, index: number) => string;
  validateOrderPosition: <UnchainedAPI = unknown>(
    validationParams: OrderSettingsOrderPositionValidation,
    unchainedAPI: UnchainedAPI,
  ) => Promise<void>;
  lockOrderDuringCheckout: boolean;
  configureSettings: (options?: OrdersSettingsOptions) => void;
}
export type OrdersSettingsOptions = Omit<Partial<OrdersSettings>, 'configureSettings'>;

export const defaultValidateOrderPosition = async ({ product }, { modules }: any) => {
  if (!modules.products.isActive(product)) {
    throw new Error('This product is inactive');
  }
};

export const ordersSettings: OrdersSettings = {
  ensureUserHasCart: false,
  orderNumberHashFn: generateRandomHash,
  validateOrderPosition: defaultValidateOrderPosition,
  lockOrderDuringCheckout: false,
  configureSettings({
    ensureUserHasCart,
    orderNumberHashFn,
    validateOrderPosition,
    lockOrderDuringCheckout,
  } = {}) {
    this.ensureUserHasCart = ensureUserHasCart || false;
    this.orderNumberHashFn = orderNumberHashFn || generateRandomHash;
    this.validateOrderPosition = validateOrderPosition || defaultValidateOrderPosition;
    this.lockOrderDuringCheckout = lockOrderDuringCheckout || false;
  },
};
