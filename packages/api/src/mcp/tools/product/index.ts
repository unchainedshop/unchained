import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../../../context.js';
import { productsListHandler, ProductsListSchema } from './listProducts.js';
import { productsCountHandler, ProductsCountSchema } from './productsCountHandler.js';
import { getProductHandler, GetProductSchema } from './getProduct.js';
import { createProductHandler, CreateProductSchema } from './createProductHandler.js';
import { removeProductHandler, RemoveProductSchema } from './removeProductHandler.js';
import { publishProductHandler, PublishProductSchema } from './publishProduct.js';
import { unpublishProductHandler, UnpublishProductSchema } from './unpublishProductHandler.js';
import { updateProductHandler, UpdateProductSchema } from './updateProductHandler.js';
import { updateProductTextsHandler, UpdateProductTextsSchema } from './updateProductTextsHandler.js';
import {
  updateProductCommerceHandler,
  UpdateProductCommerceSchema,
} from './updateProductCommerceHandler.js';
import {
  updateProductWarehousingHandler,
  UpdateProductWarehousingSchema,
} from './updateProductWarehousingHandler.js';
import { updateProductSupplyHandler, UpdateProductSupplySchema } from './updateProductSupplyHandler.js';
import {
  updateProductTokenizationHandler,
  UpdateProductTokenizationSchema,
} from './updateProductTokenizationHandler.js';
import { updateProductPlanHandler, UpdateProductPlanSchema } from './updateProductPlanHandler.js';
import {
  removeProductVariationHandler,
  RemoveProductVariationSchema,
} from './removeProductVariationHandler.js';
import {
  createProductVariationHandler,
  CreateProductVariationSchema,
} from './createProductVariationHandler.js';
import {
  addProductAssignmentHandler,
  AssignProductVariationSchema,
} from './addProductAssignmentHandler.js';
import {
  createProductVariationOptionHandler,
  CreateProductVariationOptionSchema,
} from './createProductVariationOptionHandler.js';
import {
  removeProductVariationOptionHandler,
  RemoveProductVariationOptionSchema,
} from './removeProductVariationOptionHandler.js';
import {
  removeProductAssignmentHandler,
  RemoveProductAssignmentSchema,
} from './removeProductAssignmentHandler.js';
import {
  addProductMediaUploadHandler,
  AddProductMediaUploadSchema,
} from './addProductMediaUploadHandler.js';
import { removeProductMediaHandler, RemoveProductMediaSchema } from './removeProductMediaHandler.js';
import {
  updateProductMediaTextsHandler,
  UpdateProductMediaTextsSchema,
} from './updateProductMediaTextsHandler.js';
import { reorderProductMediaHandler, ReorderProductMediaSchema } from './reorderProductMediaHandler.js';
import { productReviewsCountHandler, ProductReviewsCountSchema } from './productReviewsCountHandler.js';
import { productReviewsHandler, ProductReviewsSchema } from './productReviewsHandler.js';
import {
  translatedProductTextsHandler,
  TranslatedProductTextsSchema,
} from './translatedProductTextsHandler.js';
import {
  translatedProductMediaTextsHandler,
  TranslatedProductMediaTextsSchema,
} from './translatedProductMediaTextsHandler.js';
import {
  translatedProductVariationTextsHandler,
  TranslatedProductVariationTextsSchema,
} from './translatedProductVariationTextsHandler.js';
import {
  updateProductVariationTextsHandler,
  UpdateProductVariationTextsSchema,
} from './updateProductVariationTextsHandler.js';
import { productSiblingsHandler, ProductSiblingsSchema } from './productSiblingsHandler.js';
import { productMediaHandler, ProductMediaSchema } from './productMediaHandler.js';
import { variationProductsHandler, VariationProductsSchema } from './variationProductsHandler.js';
import { productVariationsHandler, ProductVariationsSchema } from './productVariationsHandler.js';
import {
  addProductBundleItemHandler,
  AddProductBundleItemSchema,
} from './addProductBundleItemHandler.js';
import {
  removeProductBundleItemHandler,
  RemoveProductBundleItemSchema,
} from './removeProductBundleItemHandler.js';
import { productAssignmentsHandler, ProductAssignmentsSchema } from './productAssignmentsHandler.js';
import { productBundleItemsHandler, ProductBundleItemsSchema } from './productBundleItemsHandler.js';
import { simulatedPriceRangeHandler, SimulatedPriceRangeSchema } from './simulatedPriceRangeHandler.js';
import { simulatedPriceHandler, SimulatedPriceSchema } from './simulatedPriceHandler.js';
import { catalogPriceHandler, CatalogPriceSchema } from './catalogPriceHandler.js';

export const registerProductTools = (server: McpServer, context: Context) => {
  server.tool(
    'product_list',
    'List products filtered by tags, slugs, or query string; supports pagination and sorting.',
    ProductsListSchema,
    async (params) => productsListHandler(context, params),
  );

  server.tool(
    'product_count',
    'Count products filtered by tags, slugs, draft status, or query string.',
    ProductsCountSchema,
    async (params) => productsCountHandler(context, params),
  );
  server.tool(
    'product_get',
    'Retrieve product details by productId, slug, or SKU.',
    GetProductSchema,
    async (params) => getProductHandler(context, params),
  );

  server.tool(
    'product_create',
    'Create a new product with localized text information. it will be in DRAFT/unpublish status',
    CreateProductSchema,
    async (params) => createProductHandler(context, params),
  );
  server.tool(
    'product_remove',
    'Remove a product by its ID. Changing its status to DELETED and removing it from sale',
    RemoveProductSchema,
    async (params) => removeProductHandler(context, params),
  );

  server.tool(
    'product_publish',
    'Publish a product by its id changing it to active and available for sale',
    PublishProductSchema,
    async (params) => publishProductHandler(context, params),
  );

  server.tool(
    'product_unpublish',
    'Deactivates or Unpublishes product by its id changing it to DRAFT and not available for sale',
    UnpublishProductSchema,
    async (params) => unpublishProductHandler(context, params),
  );
  server.tool(
    'product_update',
    'Update specified fields (such as tags, sequence, and metadata) of an existing product identified by its productId.',
    UpdateProductSchema,
    async (params) => updateProductHandler(context, params),
  );

  server.tool(
    'product_updateTexts',
    'Update localized texts (title, subtitle, description, slug, vendor, brand, labels) of a product',
    UpdateProductTextsSchema,
    async (params) => updateProductTextsHandler(context, params),
  );

  server.tool(
    'product_updateCommerce',
    'Update commerce information (pricing) for a product (all types except CONFIGURABLE_PRODUCT)',
    UpdateProductCommerceSchema,
    async (params) => updateProductCommerceHandler(context, params),
  );

  server.tool(
    'product_updateWarehousing',
    'Update warehousing details (SKU, base unit) for a SIMPLE_PRODUCT type product',
    UpdateProductWarehousingSchema,
    async (params) => updateProductWarehousingHandler(context, params),
  );

  server.tool(
    'product_updateSupply',
    'Update the supply (delivery) details for a SIMPLE_PRODUCT type product',
    UpdateProductSupplySchema,
    async (params) => updateProductSupplyHandler(context, params),
  );
  server.tool(
    'product_updateTokenization',
    'Update tokenization details for a TOKENIZED_PRODUCT type product',
    UpdateProductTokenizationSchema,
    async (params) => updateProductTokenizationHandler(context, params),
  );
  server.tool(
    'product_updatePlan',
    'Update the subscription plan configuration for a product of type PLAN. This includes usage calculation type (LICENSED or METERED), billing interval settings, and optional trial period configuration. This operation is only valid for products with type PLAN_PRODUCT.',
    UpdateProductPlanSchema,
    async (params) => updateProductPlanHandler(context, params),
  );

  server.tool(
    'product_createVariation',
    'Create a variation for a CONFIGURABLE_PRODUCT product including localized texts.',
    CreateProductVariationSchema,
    async (params) => createProductVariationHandler(context, params),
  );

  server.tool(
    'productVariation_remove',
    'Remove a product variation by its ID.',
    RemoveProductVariationSchema,
    async (params) => removeProductVariationHandler(context, params),
  );

  server.tool(
    'product_assignVariation',
    'Assign a product variant to a configurable product with a unique combination of option vectors. assigning with incomplete vector will fail. make sure all variation options are selected before calling this tool.',
    AssignProductVariationSchema,
    async (params) => addProductAssignmentHandler(context, params),
  );

  server.tool(
    'product_createVariationOption',
    'Create a new option for a product variation with localized titles and subtitles.',
    CreateProductVariationOptionSchema,
    async (params) => createProductVariationOptionHandler(context, params),
  );

  server.tool(
    'productVariationOption_remove',
    'Remove an option from a product variation by its value.',
    RemoveProductVariationOptionSchema,
    async (params) => removeProductVariationOptionHandler(context, params),
  );

  server.tool(
    'product_removeAssignment',
    'Remove a product variant assignment from a configurable product using attribute vectors.',
    RemoveProductAssignmentSchema,
    async (params) => removeProductAssignmentHandler(context, params),
  );

  server.tool(
    'product_addMedia',
    'Add a media asset to a product from a publicly accessible URL',
    AddProductMediaUploadSchema,
    async (params) => addProductMediaUploadHandler(context, params),
  );

  server.tool(
    'productMedia_remove',
    'Remove a product media asset by its ID.',
    RemoveProductMediaSchema,
    async (params) => removeProductMediaHandler(context, params),
  );

  server.tool(
    'productMedia_updateTexts',
    'Update localized texts (title, subtitle) of a product media asset.',
    UpdateProductMediaTextsSchema,
    async (params) => updateProductMediaTextsHandler(context, params),
  );

  server.tool(
    'product_reorderMedias',
    'Reorder media assets of a product by providing new sort keys.',
    ReorderProductMediaSchema,
    async (params) => reorderProductMediaHandler(context, params),
  );

  server.tool(
    'productReviews_count',
    'Count product reviews optionally filtered by query string.',
    ProductReviewsCountSchema,
    async (params) => productReviewsCountHandler(context, params),
  );

  server.tool(
    'productReviews_list',
    'Retrieve a paginated list of product reviews with optional filtering and sorting.',
    ProductReviewsSchema,
    async (params) => productReviewsHandler(context, params),
  );
  server.tool(
    'product_getTexts',
    'Retrieve translated texts associated with a specific product_',
    TranslatedProductTextsSchema,
    async (params) => translatedProductTextsHandler(context, params),
  );

  server.tool(
    'productMedia_getTexts',
    'Retrieve translated texts associated with a specific product media asset.',
    TranslatedProductMediaTextsSchema,
    async (params) => translatedProductMediaTextsHandler(context, params),
  );

  server.tool(
    'productVariation_getTexts',
    'Retrieve translated texts for a product variation or optionally a specific variation option.',
    TranslatedProductVariationTextsSchema,
    async (params) => translatedProductVariationTextsHandler(context, params),
  );
  server.tool(
    'productVariation_updateTexts',
    'Update product variation texts with the specified locales for product variations that match the provided variation ID and production option value.',
    UpdateProductVariationTextsSchema,
    async (params) => updateProductVariationTextsHandler(context, params),
  );
  server.tool(
    'product_siblings',
    'Retrieve sibling products of a given product, optionally filtered by assortment ID, with support for pagination and inclusion of inactive products.',
    ProductSiblingsSchema,
    async (params) => productSiblingsHandler(context, params),
  );

  server.tool(
    'product_getMedias',
    'Retrieve media assets associated with a product, optionally filtered by tags and paginated.',
    ProductMediaSchema,
    async (params) => productMediaHandler(context, params),
  );
  server.tool(
    'product_variationProducts',
    'Retrieve all variant products of a configurable product that exactly match the provided combination of variation key-value pairs (e.g., Color: Red, Size: M). You must provide at least one vector. Optionally include inactive variants in the result.',
    VariationProductsSchema,
    async (params) => variationProductsHandler(context, params),
  );

  server.tool(
    'product_variations',
    'Retrieve all defined variation attributes (e.g., Color, Size) and their possible values for a configurable product.',
    ProductVariationsSchema,
    async (params) => productVariationsHandler(context, params),
  );

  server.tool(
    'product_addBundleItem',
    'Adds a product as a bundled item to another product. Only works if the target product is of type BUNDLE_PRODUCT. You must provide the ID of the bundle and the ID and quantity of the item to include.',
    AddProductBundleItemSchema,
    async (params) => addProductBundleItemHandler(context, params),
  );

  server.tool(
    'product_removeBundleItem',
    'Removes a bundled product from a BUNDLE_PRODUCT using its 0-based index in the bundle list. The product must be of type BUNDLE_PRODUCT.',
    RemoveProductBundleItemSchema,
    async (params) => removeProductBundleItemHandler(context, params),
  );

  server.tool(
    'product_assignments',
    'Retrieve the full assignment matrix of a configurable product, including all assigned variants by their variation vectors. Optionally include inactive variants.',
    ProductAssignmentsSchema,
    async (params) => productAssignmentsHandler(context, params),
  );

  server.tool(
    'product_bundleItems',
    'Retrieve all bundle items from a product of type BUNDLE. Each item includes the configuration and quantity.',
    ProductBundleItemsSchema,
    async (params) => productBundleItemsHandler(context, params),
  );

  server.tool(
    'product_simulatedPriceRange',
    'Simulate the price range for a CONFIGURABLE_PRODUCT and its variant combinations based on quantity, variation selections, and pricing rules. Only applicable to configurable products.',
    SimulatedPriceRangeSchema,
    async (params) => simulatedPriceRangeHandler(context, params),
  );
  server.tool(
    'product_simulatedPrice',
    'Simulate the price for a product given a complete configuration vector and quantity. Useful for previewing dynamic pricing rules.',
    SimulatedPriceSchema,
    async (params) => simulatedPriceHandler(context, params),
  );

  server.tool(
    'product_catalogPrice',
    'Retrieve the catalog price for any product type, optionally for a specific quantity and currency. when ask for product price without specifying what, always use this tool',
    CatalogPriceSchema,
    async (params) => catalogPriceHandler(context, params),
  );
};
