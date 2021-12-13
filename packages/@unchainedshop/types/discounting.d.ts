import { Order, OrderDiscount } from './orders';

export interface DiscountConfiguration {
  rate?: number;
  fixedRate?: number;
}

export interface DiscountContext {
  order: Order;
  orderDiscount: OrderDiscount;
}

export interface DiscountAdapter {
  isValidForSystemTriggering: () => Promise<boolean>;
  isValidForCodeTriggering: (params: { code: string }) => Promise<boolean>;

  discountForPricingAdapterKey: (params: {
    pricingAdapterKey: string;
  }) => DiscountConfiguration;

  reserve: (params: { code: string }) => Promise<any>;
  release: () => Promise<void>;
}
