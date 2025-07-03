import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Context } from '../context.js';
import {
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
  CreateCurrencySchema,
  createCurrencyHandler,
  UpdateCurrencySchema,
  updateCurrencyHandler,
  RemoveCurrencySchema,
  removeCurrencyHandler,
  CurrenciesCountSchema,
  currenciesCountHandler,
  LanguagesCountSchema,
  languagesCountHandler,
  CreateAssortmentSchema,
  createAssortmentHandler,
  AssortmentsSchema,
  assortmentsHandler,
  AssortmentsCountSchema,
  assortmentsCountHandler,
  AssortmentSchema,
  assortmentHandler,
  UpdateAssortmentSchema,
  updateAssortmentHandler,
  RemoveAssortmentSchema,
  removeAssortmentHandler,
  SetBaseAssortmentSchema,
  setBaseAssortmentHandler,
  AssortmentChildrenSchema,
  assortmentChildrenHandler,
  assortmentProductsHandler,
  AssortmentProductsSchema,
  searchAssortmentProductHandler,
  SearchAssortmentProductSchema,
  AssortmentLinksSchema,
  assortmentLinksHandler,
  AssortmentFiltersSchema,
  assortmentFiltersHandler,
  AddAssortmentProductSchema,
  addAssortmentProductHandler,
  RemoveAssortmentProductSchema,
  removeAssortmentProductHandler,
  ReorderAssortmentProductsSchema,
  reorderAssortmentProductsHandler,
  AddAssortmentLinkSchema,
  addAssortmentLinkHandler,
  RemoveAssortmentLinkSchema,
  removeAssortmentLinkHandler,
  ReorderAssortmentMediaSchema,
  reorderAssortmentMediaHandler,
  RemoveAssortmentMediaSchema,
  removeAssortmentMediaHandler,
  AddAssortmentMediaUploadSchema,
  addAssortmentMediaUploadHandler,
  CreateFilterSchema,
  createFilterHandler,
  UpdateFilterSchema,
  updateFilterHandler,
  RemoveFilterSchema,
  removeFilterHandler,
  CreateFilterOptionSchema,
  createFilterOptionHandler,
  UpdateFilterTextsSchema,
  updateFilterTextsHandler,
  RemoveFilterOptionSchema,
  removeFilterOptionHandler,
  GetFilterSchema,
  getFilterHandler,
  GetFiltersSchema,
  getFiltersHandler,
  TranslatedFilterTextsSchema,
  translatedFilterTextsHandler,
  TranslatedAssortmentMediaTextsSchema,
  translatedAssortmentMediaTextsHandler,
  TranslatedAssortmentTextsSchema,
  translatedAssortmentTextsHandler,
  AddAssortmentFilterSchema,
  addAssortmentFilterHandler,
  RemoveAssortmentFilterSchema,
  removeAssortmentFilterHandler,
  ReorderAssortmentFiltersSchema,
  reorderAssortmentFiltersHandler,
  UpdateAssortmentTextsSchema,
  updateAssortmentTextsHandler,
  ReorderAssortmentLinksSchema,
  reorderAssortmentLinksHandler,
  UpdateAssortmentMediaTextsSchema,
  updateAssortmentMediaTextsHandler,
  ProductsListSchema,
  productsListHandler,
  UpdateProductWarehousingSchema,
  updateProductWarehousingHandler,
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
    'country_list',
    'List all available countries in the system. If a non-existing country is provided by a user, inform them it does not exist and must be created first before use.',
    ListCountriesSchema,
    async (params) => countriesHandler(context, params),
  );

  server.tool('country_get', 'Fetch a specific country by its ID.', CountrySchema, async (params) =>
    countryHandler(context, params),
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
    'shop_info',
    'Get the default configuration of the shop including country, language, currency, and locale. If the user does not provide values such as language, locale, country, or currency in their request or it cannot be derived from context, the tool MUST use the following fallback values : - language or locale: use defaultLanguageIsoCode  - country: use country_isoCode - currency: use country_defaultCurrency Always assume these values as the authoritative defaults when user input is missing or ambiguous.',
    {},
    async () => shopInfoHandler(context),
  );

  server.tool(
    'country_create',
    'Create a new country using its ISO 3166-1 alpha-2 code.',
    CreateCountrySchema,
    async (params) => createCountryHandler(context, params),
  );

  server.tool(
    'country_update',
    "Update an existing country's details including ISO code, status, and default currency.",
    UpdateCountrySchema,
    async (params) => updateCountryHandler(context, params),
  );

  server.tool(
    'country_remove',
    'Remove a country by its ID. If the country does not exist, an error will be returned.',
    RemoveCountrySchema,
    async (params) => removeCountryHandler(context, params),
  );

  server.tool(
    'country_count',
    'Count countries, optionally including inactive ones and filtered by search query.',
    CountriesCountSchema,
    async (params) => countriesCountHandler(context, params),
  );

  server.tool(
    'add_currency',
    'Adds new currency information to the system',
    CreateCurrencySchema,
    async (params) => createCurrencyHandler(context, params),
  );
  server.tool(
    'update_currency',
    'Updates the specified currency in the system',
    UpdateCurrencySchema,
    async (params) => updateCurrencyHandler(context, params),
  );

  server.tool(
    'delete_currency',
    'Deletes the specified currency from the system',
    RemoveCurrencySchema,
    async (params) => removeCurrencyHandler(context, params),
  );

  server.tool(
    'currencies_count',
    'Returns total number of currencies registered in the system',
    CurrenciesCountSchema,
    async (params) => currenciesCountHandler(context, params),
  );

  server.tool(
    'languages_count',
    'Returns total number of languages registered in the system',
    LanguagesCountSchema,
    async (params) => languagesCountHandler(context, params),
  );

  server.tool(
    'assortment_create',
    'Create a new assortment with optional localized texts.',
    CreateAssortmentSchema,
    async (params) => createAssortmentHandler(context, params),
  );

  server.tool(
    'assortment_update',
    'Update fields of an existing assortment by ID.',
    UpdateAssortmentSchema,
    async (params) => updateAssortmentHandler(context, params),
  );

  server.tool(
    'assortment_remove',
    'Remove an assortment by ID.',
    RemoveAssortmentSchema,
    async (params) => removeAssortmentHandler(context, params),
  );

  server.tool(
    'assortment_setBase',
    'Makes the provided assortment the base assortment and resets others to regular.',
    SetBaseAssortmentSchema,
    async (params) => setBaseAssortmentHandler(context, params),
  );

  server.tool(
    'assortment_get',
    'Fetch details of an assortment by ID or slug.',
    AssortmentSchema,
    async (params) => assortmentHandler(context, params),
  );

  server.tool(
    'assortment_list',
    'List assortments with filtering, pagination, and sorting options.',
    AssortmentsSchema,
    async (params) => assortmentsHandler(context, params),
  );

  server.tool(
    'assortment_count',
    'Count assortments matching given filters.',
    AssortmentsCountSchema,
    async (params) => assortmentsCountHandler(context, params),
  );

  server.tool(
    'assortment_getChildren',
    'Fetch child assortments for a given assortment ID (or root-level assortments if none is provided).',
    AssortmentChildrenSchema,
    async (params) => assortmentChildrenHandler(context, params),
  );

  server.tool(
    'assortment_getProducts',
    'Fetch products for a given assortment, optionally including inactive ones.',
    AssortmentProductsSchema,
    async (params) => assortmentProductsHandler(context, params),
  );

  server.tool(
    'assortment_searchProducts',
    'Search products within an assortment with optional filtering and pagination.',
    SearchAssortmentProductSchema,
    async (params) => searchAssortmentProductHandler(context, params),
  );

  server.tool(
    'assortment_getLinks',
    'Fetch parent and child links for a given assortment_',
    AssortmentLinksSchema,
    async (params) => assortmentLinksHandler(context, params),
  );

  server.tool(
    'assortment_getFilters',
    'Fetch filters associated with a specific assortment_',
    AssortmentFiltersSchema,
    async (params) => assortmentFiltersHandler(context, params),
  );

  server.tool(
    'assortment_addProduct',
    'Add a product to an assortment with optional tags.',
    AddAssortmentProductSchema,
    async (params) => addAssortmentProductHandler(context, params),
  );

  server.tool(
    'assortment_removeProduct',
    'Remove a product from an assortment_',
    RemoveAssortmentProductSchema,
    async (params) => removeAssortmentProductHandler(context, params),
  );

  server.tool(
    'assortment_reorderProducts',
    'Reorder assortment products by assigning new sort keys.',
    ReorderAssortmentProductsSchema,
    async (params) => reorderAssortmentProductsHandler(context, params),
  );

  server.tool(
    'assortment_linkChild',
    'Create a parent-child relationship between two assortments, with optional tags.',
    AddAssortmentLinkSchema,
    async (params) => addAssortmentLinkHandler(context, params),
  );

  server.tool(
    'assortment_removeLink',
    'Remove a link between assortments by ID.',
    RemoveAssortmentLinkSchema,
    async (params) => removeAssortmentLinkHandler(context, params),
  );

  server.tool(
    'assortment_reorderLinks',
    'Reorder assortment links by assigning new sort keys.',
    ReorderAssortmentLinksSchema,
    async (params) => reorderAssortmentLinksHandler(context, params),
  );

  server.tool(
    'assortment_reorderMedia',
    'Reorder assortment media assets with new sorting keys; first item becomes primary media.',
    ReorderAssortmentMediaSchema,
    async (params) => reorderAssortmentMediaHandler(context, params),
  );

  server.tool(
    'assortment_addMedia',
    'Upload and link a media asset (e.g., image or video) to an assortment_',
    AddAssortmentMediaUploadSchema,
    async (params) => addAssortmentMediaUploadHandler(context, params),
  );

  server.tool(
    'assortment_removeMedia',
    'Remove a media asset previously attached to an assortment_',
    RemoveAssortmentMediaSchema,
    async (params) => removeAssortmentMediaHandler(context, params),
  );

  server.tool(
    'assortmentMedia_updateTexts',
    'Update localized texts for a specific assortment media asset.',
    UpdateAssortmentMediaTextsSchema,
    async (params) => updateAssortmentMediaTextsHandler(context, params),
  );

  server.tool('add_filter', `Creates new Filter`, CreateFilterSchema, async (params) =>
    createFilterHandler(context, params),
  );
  server.tool('update_filter', `Update filter information`, UpdateFilterSchema, async (params) =>
    updateFilterHandler(context, params),
  );

  server.tool('remove_filter', ` Deletes the specified filter`, RemoveFilterSchema, async (params) =>
    removeFilterHandler(context, params),
  );
  server.tool(
    'add_filter_option',
    `Adds new option to filters`,
    CreateFilterOptionSchema,
    async (params) => createFilterOptionHandler(context, params),
  );

  server.tool(
    'update_filter_texts',
    `Updates or created specified filter texts for filter with ID provided and locale and optionally filterOptionValue`,
    UpdateFilterTextsSchema,
    async (params) => updateFilterTextsHandler(context, params),
  );

  server.tool(
    'remove_filter_option',
    `Removes the filter option from the specified filter.`,
    RemoveFilterOptionSchema,
    async (params) => removeFilterOptionHandler(context, params),
  );

  server.tool('get_filter', `Get a specific filter by ID`, GetFilterSchema, async (params) =>
    getFilterHandler(context, params),
  );

  server.tool(
    'list_filters',
    `Get all filters, by default sorted by creation date (ascending), optionally it can filter based on various parameters including querystring`,
    GetFiltersSchema,
    async (params) => getFiltersHandler(context, params),
  );

  server.tool(
    'filter_localized_texts',
    `Returns localized filter texts found in the system for the specified filterId`,
    TranslatedFilterTextsSchema,
    async (params) => translatedFilterTextsHandler(context, params),
  );

  server.tool(
    'assortmentMedia_getTexts',
    'Retrieve translated texts associated with a specific assortment media asset.',
    TranslatedAssortmentMediaTextsSchema,
    async (params) => translatedAssortmentMediaTextsHandler(context, params),
  );

  server.tool(
    'assortment_getTexts',
    'Retrieve translated texts for a specific assortment_',
    TranslatedAssortmentTextsSchema,
    async (params) => translatedAssortmentTextsHandler(context, params),
  );

  server.tool(
    'assortment_updateTexts',
    'Update localized texts (title, subtitle, description, slug) of an assortment for one or more locales.',
    UpdateAssortmentTextsSchema,
    async (params) => updateAssortmentTextsHandler(context, params),
  );

  server.tool(
    'assortment_addFilter',
    'Attach a filter to a specific assortment, optionally tagging the relation.',
    AddAssortmentFilterSchema,
    async (params) => addAssortmentFilterHandler(context, params),
  );

  server.tool(
    'assortment_removeFilter',
    'Remove a filter from an assortment_',
    RemoveAssortmentFilterSchema,
    async (params) => removeAssortmentFilterHandler(context, params),
  );

  server.tool(
    'assortment_reorderFilters',
    'Reorder assortment filters by assigning new sort keys.',
    ReorderAssortmentFiltersSchema,
    async (params) => reorderAssortmentFiltersHandler(context, params),
  );

  return server;
}
