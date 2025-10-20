import { Product, ProductConfiguration } from '@unchainedshop/core-products';

type ResolvedConfiguration = {
  fixedRate?: number;
  rate?: number;
  isNetPrice?: boolean;
  taxRate?: number;
} & Record<string, any>;

export type PriceConfigurationResolver = (
  product: Product,
  quantity: number,
  configuration: ProductConfiguration[] | null,
) => ResolvedConfiguration | null;

export interface ProductDiscountConfiguration extends ResolvedConfiguration {
  customPriceConfigurationResolver?: PriceConfigurationResolver;
}
