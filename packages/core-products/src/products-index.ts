export * from './types.js';
export * from './module/configureProductsModule.js';
export * from './products-settings.js';

export { ProductPricingAdapter } from './director/ProductPricingAdapter.js';
export { ProductPricingDirector } from './director/ProductPricingDirector.js';
export { ProductDiscountConfiguration } from './director/ProductDiscountConfiguration.js';
export { ProductPricingSheet } from './director/ProductPricingSheet.js';

export { ProductStatus } from './db/ProductStatus.js';

export enum ProductTypes {
  SimpleProduct = 'SIMPLE_PRODUCT',
  ConfigurableProduct = 'CONFIGURABLE_PRODUCT',
  BundleProduct = 'BUNDLE_PRODUCT',
  PlanProduct = 'PLAN_PRODUCT',
  TokenizedProduct = 'TOKENIZED_PRODUCT',
}
