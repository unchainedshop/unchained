import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../context.js';
import {
  listProductsHandler,
  ListProductsSchema,
  getProductHandler,
  GetProductSchema,
  createProductHandler,
  CreateProductSchema,
  RemoveProductSchema,
  removeProductHandler,
  PublishProductSchema,
  publishProductHandler,
  UnpublishProductSchema,
  unpublishProductHandler,
  UpdateProductSchema,
  updateProductHandler,
  UpdateProductTextsSchema,
  updateProductTextsHandler,
  UpdateProductCommerceSchema,
  updateProductCommerceHandler,
  ListCurrenciesSchema,
  currenciesHandler,
  CurrencySchema,
  currencyHandler,
  ListCountriesSchema,
  countriesHandler,
  CountrySchema,
  countryHandler,
  ListLanguagesSchema,
  languagesHandler,
  LanguageSchema,
  languageHandler,
  UpdateProductSupplySchema,
  updateProductSupplyHandler,
  UpdateProductPlanSchema,
  updateProductPlanHandler,
  UpdateProductTokenizationSchema,
  updateProductTokenizationHandler,
  ProductsCountSchema,
  productsCountHandler,
  CreateProductVariationSchema,
  createProductVariationHandler,
  RemoveProductVariationSchema,
  removeProductVariationHandler,
  AssignProductVariationSchema,
  addProductAssignmentHandler,
  CreateProductVariationOptionSchema,
  createProductVariationOptionHandler,
  removeProductAssignmentHandler,
  RemoveProductVariationOptionSchema,
  removeProductVariationOptionHandler,
  RemoveProductAssignmentSchema,
  CreateLanguageSchema,
  createLanguageHandler,
  UpdateLanguageSchema,
  updateLanguageHandler,
  RemoveLanguageSchema,
  removeLanguageHandler,
  AddProductMediaUploadSchema,
  addProductMediaUploadHandler,
  RemoveProductMediaSchema,
  removeProductMediaHandler,
  UpdateProductMediaTextsSchema,
  updateProductMediaTextsHandler,
  ReorderProductMediaSchema,
  reorderProductMediaHandler,
  ProductReviewsCountSchema,
  productReviewsCountHandler,
  ProductReviewsSchema,
  productReviewsHandler,
  TranslatedProductTextsSchema,
  translatedProductTextsHandler,
  TranslatedProductMediaTextsSchema,
  translatedProductMediaTextsHandler,
  TranslatedProductVariationTextsSchema,
  translatedProductVariationTextsHandler,
  shopInfoHandler,
  CreateCountrySchema,
  createCountryHandler,
  UpdateCountrySchema,
  updateCountryHandler,
  RemoveCountrySchema,
  removeCountryHandler,
  CountriesCountSchema,
  countriesCountHandler,
} from './tools/index.js';

export default function createMcpServer(context: Context, roles) {
  const server = new McpServer({
    name: 'Unchained MCP Server',
    version: '1.0.0',
  });

  if (!roles?.includes('admin')) {
    return server;
  }

  server.tool(
    'list_products',
    `Search and list products with comprehensive filtering, sorting, and pagination support.`,
    ListProductsSchema,
    async (params) => listProductsHandler(context, params),
  );

  server.tool(
    'products_count',
    'Search and returns total number of products registered in the system with comprehensive filtering if provided',
    ProductsCountSchema,
    async (params) => productsCountHandler(context, params),
  );
  server.tool('get_product', 'Get detailed product information', GetProductSchema, async (params) =>
    getProductHandler(context, params),
  );

  server.tool(
    'create_product',
    'Adds or create new product the product will be in DRAFT/unpublish status',
    CreateProductSchema,
    async (params) => createProductHandler(context, params),
  );
  server.tool(
    'remove_product',
    'Removed or deletes a product by its id changing its status to DELETED and removing it from sale',
    RemoveProductSchema,
    async (params) => removeProductHandler(context, params),
  );

  server.tool(
    'publish_product',
    'Publish a product by its id changing it to active and available for sale',
    PublishProductSchema,
    async (params) => publishProductHandler(context, params),
  );

  server.tool(
    'unpublish_product',
    'Deactivates or Unpublishes product by its id changing it to DRAFT and not available for sale',
    UnpublishProductSchema,
    async (params) => unpublishProductHandler(context, params),
  );
  server.tool(
    'update_product',
    'Modify/Update generic infos of a product (tags for ex.)',
    UpdateProductSchema,
    async (params) => updateProductHandler(context, params),
  );

  server.tool(
    'update_product_texts',
    'Modify/update localized texts of a product',
    UpdateProductTextsSchema,
    async (params) => updateProductTextsHandler(context, params),
  );

  server.tool(
    'update_product_commerce',
    'Modify/update products commerce info like prices, taxes, etc. for all product types except CONFIGURABLE_PRODUCT. for currency value always use registered currency in the system and not a custom one, it should not be called for CONFIGURABLE_PRODUCT type products',
    UpdateProductCommerceSchema,
    async (params) => updateProductCommerceHandler(context, params),
  );

  server.tool(
    'update_product_warehousing',
    'Modify/update products commerce info like prices, taxes, etc. for SIMPLE_PRODUCT product type only.  it is only available for SIMPLE_PRODUCT type products',
    UpdateProductCommerceSchema,
    async (params) => updateProductCommerceHandler(context, params),
  );

  server.tool(
    'update_product_supply',
    'Modify/update products supply of SIMPLE_PRODUCT type info like prices, taxes, etc. it is only available for SIMPLE_PRODUCT type products',
    UpdateProductSupplySchema,
    async (params) => updateProductSupplyHandler(context, params),
  );
  server.tool(
    'update_tokenized_product',
    'Modify/update products supply of TOKENIZED_PRODUCT type info like contractAddress, contractStandard, tokenId, supply, ercMetadataProperties etc. it is only available for TOKENIZED_PRODUCT type products',
    UpdateProductTokenizationSchema,
    async (params) => updateProductTokenizationHandler(context, params),
  );
  server.tool(
    'update_product_plan',
    'Modify/update products subscription/plan information of PLAN_PRODUCT type info like billing period, trial period and usage calculation, etc. it is only available for PLAN_PRODUCT type products',
    UpdateProductPlanSchema,
    async (params) => updateProductPlanHandler(context, params),
  );

  server.tool(
    'list_currencies',
    'List all available currencies in the system, if non existing currency is provided to you by a user inform them it does not exist and to create it first before they can use it',
    ListCurrenciesSchema,
    async (params) => currenciesHandler(context, params),
  );

  server.tool(
    'get_currency',
    'Gets a single currency registered in the system',
    CurrencySchema,
    async (params) => currencyHandler(context, params),
  );

  server.tool(
    'list_countries',
    'List all available countries in the system, if non existing country is provided to you by a user inform them it does not exist and to create it first before they can use it',
    ListCountriesSchema,
    async (params) => countriesHandler(context, params),
  );

  server.tool(
    'get_country',
    'Gets a single country registered in the system',
    CountrySchema,
    async (params) => countryHandler(context, params),
  );

  server.tool(
    'list_languages',
    'List all available languages in the system, if non existing language is provided to you by a user inform them it does not exist and to create it first before they can use it',
    ListLanguagesSchema,
    async (params) => languagesHandler(context, params),
  );

  server.tool(
    'get_language',
    'Gets a single language registered in the system',
    LanguageSchema,
    async (params) => languageHandler(context, params),
  );

  server.tool(
    'create_product_variation',
    'Adds/create a variation of a product, it is only available for CONFIGURABLE_PRODUCT type products',
    CreateProductVariationSchema,
    async (params) => createProductVariationHandler(context, params),
  );

  server.tool(
    'remove_product_variation',
    'removes a variation of a product',
    RemoveProductVariationSchema,
    async (params) => removeProductVariationHandler(context, params),
  );

  server.tool(
    'assign_product_variation',
    'Link a product to a ConfigurableProduct variation option by providing a vector combination that uniquely identifies the variation option',
    AssignProductVariationSchema,
    async (params) => addProductAssignmentHandler(context, params),
  );

  server.tool(
    'add_variation_options',
    'Adds variation option to an existing product variations',
    CreateProductVariationOptionSchema,
    async (params) => createProductVariationOptionHandler(context, params),
  );

  server.tool(
    'remove_variation_options',
    'Removes product option value for product variation with the provided variation option value',
    RemoveProductVariationOptionSchema,
    async (params) => removeProductVariationOptionHandler(context, params),
  );

  server.tool(
    'remove_product_variation_assignment',
    'Unlinks a product from a ConfigurableProduct by providing a configuration combination that uniquely identifies a row in the assignment matrix',
    RemoveProductAssignmentSchema,
    async (params) => removeProductAssignmentHandler(context, params),
  );

  server.tool('add_language', 'Adds new language', CreateLanguageSchema, async (params) =>
    createLanguageHandler(context, params),
  );

  server.tool('update_language', 'Updates language', UpdateLanguageSchema, async (params) =>
    updateLanguageHandler(context, params),
  );

  server.tool('remove_language', 'Deletes a language', RemoveLanguageSchema, async (params) =>
    removeLanguageHandler(context, params),
  );

  server.tool(
    'add_product_media',
    'Adds media to a product',
    AddProductMediaUploadSchema,
    async (params) => addProductMediaUploadHandler(context, params),
  );

  server.tool(
    'remove_product_media',
    "Remove a media asset from a product's visualization",
    RemoveProductMediaSchema,
    async (params) => removeProductMediaHandler(context, params),
  );

  server.tool(
    'update_product_media_texts',
    "Modify localized texts part of a product's media asset",
    UpdateProductMediaTextsSchema,
    async (params) => updateProductMediaTextsHandler(context, params),
  );

  server.tool(
    'reorder_product_media',
    'Reorder a media asset (first is primary)',
    ReorderProductMediaSchema,
    async (params) => reorderProductMediaHandler(context, params),
  );

  server.tool(
    'product_review_count',
    'Returns total number of product reviews',
    ProductReviewsCountSchema,
    async (params) => productReviewsCountHandler(context, params),
  );

  server.tool(
    'product_reviews',
    'Get all product reviews, by default sorted by creation date (descending)',
    ProductReviewsSchema,
    async (params) => productReviewsHandler(context, params),
  );
  server.tool(
    'product_localized_texts',
    'Returns Localization: Meta data for product',
    TranslatedProductTextsSchema,
    async (params) => translatedProductTextsHandler(context, params),
  );

  server.tool(
    'product_media_localized_texts',
    'Returns Localization: Meta data for product media',
    TranslatedProductMediaTextsSchema,
    async (params) => translatedProductMediaTextsHandler(context, params),
  );

  server.tool(
    'product_variation_localized_texts',
    'Returns Localization: Meta data for product variation',
    TranslatedProductVariationTextsSchema,
    async (params) => translatedProductVariationTextsHandler(context, params),
  );
  server.tool(
    'shop_info',
    'Get the default configuration of the shop including country, language, currency, and locale. If the user does not provide values such as language, locale, country, or currency in their request or it cannot be derived from context, the tool MUST use the following fallback values : - language or locale: use defaultLanguageIsoCode  - country: use country.isoCode - currency: use country.defaultCurrency Always assume these values as the authoritative defaults when user input is missing or ambiguous.',
    {},
    async () => shopInfoHandler(context),
  );

  server.tool(
    'add_country',
    'Adds new country information to the system',
    CreateCountrySchema,
    async (params) => createCountryHandler(context, params),
  );

  server.tool(
    'update_country',
    'Updates provided country information',
    UpdateCountrySchema,
    async (params) => updateCountryHandler(context, params),
  );

  server.tool('delete_country', 'Deletes the specified country', RemoveCountrySchema, async (params) =>
    removeCountryHandler(context, params),
  );

  server.tool(
    'countries_count',
    'Returns total number of countries registered in the system',
    CountriesCountSchema,
    async (params) => countriesCountHandler(context, params),
  );

  return server;
}
