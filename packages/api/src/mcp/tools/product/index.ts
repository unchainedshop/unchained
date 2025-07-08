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
    'Update the plan details for a PLAN_PRODUCT type product',
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
    'Assign a product variant to a configurable product with a unique combination of attribute vectors.',
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
    'product_media_reorder',
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
};
