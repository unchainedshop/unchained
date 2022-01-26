import { Order } from './orders';
import { OrderDiscount } from './orders.discounts';
import { OrderPosition } from './orders.positions';
import {
  BasePricingAdapterContext,
  IPricingAdapter,
  IPricingDirector,
  IPricingSheet,
  PricingCalculation,
} from './pricing';
import { Product } from './products';
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
  discounts: Array<OrderDiscount>;
  order: Order;
  product: Product;
  quantity: number;
  user: User;
}

export type ProductPricingContext = {
  country?: string;
  currency?: string;
  discounts?: Array<OrderDiscount>;
  order?: Order;
  product?: Product;
  quantity?: number;
  user?: User;
};

export interface IProductPricingSheet
  extends IPricingSheet<ProductPricingCalculation> {
  addItem: (params: {
    amount: number;
    isTaxable: boolean;
    isNetPrice: boolean;
    meta: any;
  }) => void;
  unitPrice: (params: { useNetPrice: boolean }) => {
    amount: number;
    currency: string;
  };
}

export type IProductPricingAdapter = IPricingAdapter<
  ProductPricingAdapterContext,
  ProductPricingCalculation,
  IProductPricingSheet
>;

export interface IProductPricingDirector
  extends IPricingDirector<
    ProductPricingContext,
    ProductPricingAdapterContext,
    ProductPricingCalculation,
    IProductPricingAdapter
  > {
  resultSheet: () => IProductPricingSheet;
}
