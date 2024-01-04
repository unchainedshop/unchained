import { Order } from './orders.js';
import { OrderDiscount } from './orders.discounts.js';
import {
  BasePricingAdapterContext,
  IPricingAdapter,
  IPricingDirector,
  IPricingSheet,
  PricingCalculation,
} from './pricing.js';
import { Product, ProductConfiguration } from './products.js';
import { User } from './user.js';
import { OrderPosition } from './orders.positions.js';

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
  product: Product;
  quantity: number;
  configuration: Array<ProductConfiguration>;
}

export type ProductPricingContext =
  | {
      country?: string;
      currency?: string;
      discounts?: Array<OrderDiscount>;
      order?: Order;
      product?: Product;
      quantity?: number;
      configuration: Array<ProductConfiguration>;
      user?: User;
    }
  | {
      item: OrderPosition;
    };

export interface IProductPricingSheet extends IPricingSheet<ProductPricingCalculation> {
  addItem: (params: Omit<ProductPricingCalculation, 'category' | 'discountId'>) => void;
  addTax: (params: { amount: number; rate: number; meta?: any }) => void;
  addDiscount: (params: {
    amount: number;
    isTaxable: boolean;
    isNetPrice: boolean;
    discountId: string;
    meta?: any;
  }) => void;

  unitPrice: (params?: { useNetPrice: boolean }) => {
    amount: number;
    currency: string;
  };
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
  expiresAt: Date;
  timestamp: Date;
};
