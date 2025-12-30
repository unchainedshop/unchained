// Database schema and initialization
export {
  products,
  productTexts,
  productMedia,
  productMediaTexts,
  productVariations,
  productVariationTexts,
  productReviews,
  productRates,
  ProductStatus,
  ProductType,
  ProductContractStandard,
  ProductVariationType,
  ProductReviewVoteType,
  type ProductRow,
  type NewProductRow,
  type ProductTextRow,
  type NewProductTextRow,
  type ProductMediaRow,
  type NewProductMediaRow,
  type ProductMediaTextRow,
  type NewProductMediaTextRow,
  type ProductVariationRow,
  type NewProductVariationRow,
  type ProductVariationTextRow,
  type NewProductVariationTextRow,
  type ProductReviewRow,
  type NewProductReviewRow,
  type ProductRateRow,
  type NewProductRateRow,
  type ProductStatusType,
  type ProductTypeType,
  type ProductContractStandardType,
  type ProductVariationTypeType,
  type ProductReviewVoteTypeType,
  type ProductAssignment,
  type ProductProxy,
  type ProductSupply,
  type ProductConfiguration,
  type ProductBundleItem,
  type ProductPrice,
  type ProductCommerce,
  type ProductTokenization,
  type ProductPlan,
  type ProductWarehousing,
  type ProductVote,
  initializeProductsSchema,
  searchProductsFTS,
  searchProductTextsFTS,
  searchProductReviewsFTS,
} from './db/index.ts';

// Modules
export * from './module/configureProductsModule.ts';
export * from './module/configureProductMediaModule.ts';
export * from './module/configureProductPrices.ts';
export * from './module/configureProductReviewsModule.ts';
export * from './module/configureProductTextsModule.ts';
export * from './module/configureProductVariationsModule.ts';

// Settings
export * from './products-settings.ts';
