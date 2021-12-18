import { Order, OrderDiscount } from './orders';

export interface DiscountConfiguration {
  fixedRate?: number;
  rate?: number;
  isNetPrice?: boolean;
}

export interface Discount {
  discountId: string;
  configuration: DiscountConfiguration;
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