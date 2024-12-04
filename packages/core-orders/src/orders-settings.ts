import { generateRandomHash } from '@unchainedshop/utils';
import { Order } from './types.js';

export interface OrderSettingsOrderPositionValidation<Product = unknown> {
  order: Order;
  product: Product;
  quantityDiff?: number;
  configuration?: Array<{ key: string; value: string }>;
}

export interface OrdersSettingsOptions {
  ensureUserHasCart?: boolean;
  orderNumberHashFn?: (order: Order, index: number) => string;
  validateOrderPosition?: (
    validationParams: OrderSettingsOrderPositionValidation,
    context,
  ) => Promise<void>;
  lockOrderDuringCheckout?: boolean;
}

export const defaultValidateOrderPosition = async ({ product }, { modules }) => {
  if (!modules.products.isActive(product)) {
    throw new Error('This product is inactive');
  }
};

export const ordersSettings = {
  ensureUserHasCart: null,
  orderNumberHashFn: null,
  validateOrderPosition: null,
  lockOrderDuringCheckout: false,

  configureSettings({
    ensureUserHasCart = false,
    orderNumberHashFn = generateRandomHash,
    validateOrderPosition = defaultValidateOrderPosition,
    lockOrderDuringCheckout = false,
  }: OrdersSettingsOptions = {}) {
    this.ensureUserHasCart = ensureUserHasCart;
    this.orderNumberHashFn = orderNumberHashFn;
    this.validateOrderPosition = validateOrderPosition;
    this.lockOrderDuringCheckout = lockOrderDuringCheckout;
  },
};
