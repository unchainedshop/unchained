import { generateRandomHash } from '@unchainedshop/utils';
import type { Order } from './db/OrdersCollection.ts';

export interface OrderSettingsOrderPositionValidation<Product = unknown> {
  order: Order;
  product: Product;
  quantityDiff?: number;
  configuration?: { key: string; value: string }[] | null;
}

export interface OrderCheckoutReservation {
  release: () => Promise<void>;
}

export interface OrdersSettings {
  ensureUserHasCart: boolean;
  orderNumberHashFn: (order: Order, index: number) => string;
  validateOrderPosition: <UnchainedAPI = unknown>(
    validationParams: OrderSettingsOrderPositionValidation,
    unchainedAPI: UnchainedAPI,
  ) => Promise<void>;
  /**
   * Called by checkoutOrder under the order lock, after the order is validated and before payment
   * starts. The returned reservation is released once the checkout ends, whether it succeeded or
   * failed; throwing aborts the checkout. Release what you acquired before throwing.
   */
  reserveForCheckout?: <UnchainedAPI = unknown>(
    order: Order,
    unchainedAPI: UnchainedAPI,
  ) => Promise<OrderCheckoutReservation | void | null | undefined>;
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
  configureSettings({
    ensureUserHasCart,
    orderNumberHashFn,
    validateOrderPosition,
    reserveForCheckout,
  } = {}) {
    this.ensureUserHasCart = ensureUserHasCart || false;
    this.orderNumberHashFn = orderNumberHashFn || generateRandomHash;
    this.validateOrderPosition = validateOrderPosition || defaultValidateOrderPosition;
    this.reserveForCheckout = reserveForCheckout;
  },
};
