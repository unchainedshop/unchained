import { Order } from './orders';
import { OrderDiscount } from './orders.discounts';
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

export interface ProductPricingAdapterContext extends BasePricingAdapterContext {
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

export interface IProductPricingSheet extends IPricingSheet<ProductPricingCalculation> {
  addItem: (params: ProductPricingCalculation) => void;
  itemSum: () => number;
  getItemRows: () => ProductPricingCalculation[];
  unitPrice: (params?: { useNetPrice: boolean }) => ProductPricingCalculation;
}

export type IProductPricingAdapter = IPricingAdapter<
  ProductPricingAdapterContext,
  ProductPricingCalculation,
  IProductPricingSheet
>;

export type IProductPricingDirector = IPricingDirector<
  ProductPricingContext,
  ProductPricingCalculation,
  ProductPricingAdapterContext,
  IProductPricingSheet,
  IProductPricingAdapter
>;

export type ProductPriceRate = {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  timestamp: number | null;
};
