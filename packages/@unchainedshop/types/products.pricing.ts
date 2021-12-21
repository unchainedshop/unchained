import { Discount } from './discounting';
import { Order, OrderDiscount } from './orders';
import {
  BasePricingAdapterContext,
  IPricingAdapter,
  IPricingDirector,
  IPricingSheet,
  PricingCalculation,
} from './pricing';
import { User } from './user';

export enum ProductPricingRowCategory {
  Item = 'ITEM',
  Discount = 'DISCOUNT',
  Tax = 'TAX',
}

export interface ProductPricingCalculation extends PricingCalculation {
  discountId?: string;
  isTaxable: boolean;
  isNetPrice: boolean;
  rate?: number;
}

export interface ProductPricingAdapterContext
  extends BasePricingAdapterContext {
  country: string;
  currency: string;
  discounts: Array<Discount>;
  order: Order;
  product: any; // TODO: update with product type
  quantity: number;
  user: User;
}

export interface ProductPricingContext {
  country?: string;
  currency?: string;
  discounts?: Array<OrderDiscount>;
  order?: Order;
  product?: any; // TODO: update with product type
  quantity?: number;
  user?: User;
}

export interface IProductPricingSheet
  extends IPricingSheet<ProductPricingCalculation> {}
  
export interface IProductPricingAdapter
  extends IPricingAdapter<
    ProductPricingAdapterContext,
    ProductPricingCalculation,
    IProductPricingSheet
  > {}

export interface IProductPricingDirector
  extends IPricingDirector<
    ProductPricingContext,
    ProductPricingAdapterContext,
    ProductPricingCalculation,
    IProductPricingAdapter
  > {
  resultSheet: () => IProductPricingSheet;
}
