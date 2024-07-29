import { ModuleInput, ModuleMutations, UnchainedCore } from '@unchainedshop/core';
import {
  Product,
  ProductAssignment,
  ProductBundleItem,
  ProductConfiguration,
  ProductDiscount,
  ProductPrice,
  ProductPriceRange,
  ProductQuery,
  ProductText,
} from '../types.js';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  findPreservingIds,
  generateDbFilterById,
  generateDbMutations,
  buildSortOptions,
  mongodb,
} from '@unchainedshop/mongodb';
import { SortDirection, SortOption } from '@unchainedshop/utils';
import { ProductDiscountDirector } from '../director/ProductDiscountDirector.js';
import { ProductsCollection } from '../db/ProductsCollection.js';
import { ProductsSchema, ProductTypes } from '../db/ProductsSchema.js';
import { ProductStatus } from '../db/ProductStatus.js';
import { ProductPricingSheet } from '../director/ProductPricingSheet.js';
import { ProductPricingDirector } from '../products-index.js';
import { configureProductMediaModule, ProductMediaModule } from './configureProductMediaModule.js';
import { configureProductPricesModule } from './configureProductPrices.js';
import { configureProductReviewsModule } from './configureProductReviewsModule.js';
import { configureProductTextsModule } from './configureProductTextsModule.js';
import { configureProductVariationsModule } from './configureProductVariationsModule.js';
import { productsSettings, ProductsSettingsOptions } from '../products-settings.js';
import addMigrations from '../migrations/addMigrations.js';
import {
  IProductPricingSheet,
  ProductPriceRate,
  ProductPricingCalculation,
  ProductPricingContext,
} from '../types.js';
import { IDiscountAdapter } from '@unchainedshop/types/discount.js';
import { Currency } from '@unchainedshop/core-currencies';
import { OrderPosition } from '@unchainedshop/core-orders';
import { ProductReviewsModule } from '@unchainedshop/types/products.reviews.js';
import { ProductVariationsModule } from '@unchainedshop/types/products.variations.js';

const PRODUCT_EVENTS = [
  'PRODUCT_CREATE',
  'PRODUCT_REMOVE',
  'PRODUCT_SET_BASE',
  'PRODUCT_UPDATE',
  'PRODUCT_PUBLISH',
  'PRODUCT_UNPUBLISH',
  'PRODUCT_ADD_ASSIGNMENT',
  'PRODUCT_REMOVE_ASSIGNMENT',
  'PRODUCT_CREATE_BUNDLE_ITEM',
  'PRODUCT_REMOVE_BUNDLE_ITEM',
];

const InternalProductStatus = {
  DRAFT: null,
};

export const buildFindSelector = ({
  slugs,
  tags,
  includeDrafts = false,
  productIds,
  productSelector,
  queryString,
  ...query
}: ProductQuery) => {
  const selector: mongodb.Filter<Product> = productSelector ? { ...productSelector, ...query } : query;

  if (productIds) {
    selector._id = { $in: productIds };
  }

  if (slugs) {
    selector.slugs = { $in: slugs };
  }

  if (tags) {
    if (Array.isArray(tags)) {
      selector.tags = { $all: tags };
    } else {
      selector.tags = tags;
    }
  }

  if (queryString) {
    (selector as any).$text = { $search: queryString };
  }

  if (!selector.status) {
    selector.status = !includeDrafts
      ? { $eq: ProductStatus.ACTIVE }
      : {
          $in: [ProductStatus.ACTIVE, InternalProductStatus.DRAFT],
        };
  }

  return selector;
};

export type ProductsModule = {
  // Queries
  findProduct: (params: { productId?: string; slug?: string; sku?: string }) => Promise<Product>;

  findProducts: (
    params: ProductQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    },
    options?: mongodb.FindOptions,
  ) => Promise<Array<Product>>;

  count: (query: ProductQuery) => Promise<number>;
  productExists: (params: { productId?: string; slug?: string }) => Promise<boolean>;

  // Transformations
  interface: (productDiscount: ProductDiscount) => IDiscountAdapter<unknown>;

  isActive: (product: Product) => boolean;
  isDraft: (product: Product) => boolean;

  normalizedStatus: (product: Product) => ProductStatus;

  pricingSheet: (params: {
    calculation: Array<ProductPricingCalculation>;
    currency: string;
    quantity: number;
  }) => IProductPricingSheet;

  proxyAssignments: (
    product: Product,
    options: { includeInactive?: boolean },
  ) => Promise<Array<{ assignment: ProductAssignment; product: Product }>>;

  proxyProducts: (
    product: Product,
    vectors: Array<ProductConfiguration>,
    options: { includeInactive?: boolean },
  ) => Promise<Array<Product>>;

  resolveOrderableProduct: (
    product: Product,
    params: { configuration?: Array<ProductConfiguration> },
    unchainedAPI: UnchainedCore,
  ) => Promise<Product>;

  prices: {
    price: (
      product: Product,
      params: { country: string; currency?: string; quantity?: number },
    ) => Promise<ProductPrice>;

    userPrice: (
      prodct: Product,
      params: {
        userId: string;
        country: string;
        currency: string;
        quantity?: number;
        useNetPrice?: boolean;
        configuration?: Array<ProductConfiguration>;
      },
      unchainedAPI: UnchainedCore,
    ) => Promise<ProductPrice>;

    catalogPrices: (prodct: Product) => Array<ProductPrice>;
    catalogPricesLeveled: (
      product: Product,
      params: { currency: string; country: string },
    ) => Promise<
      Array<{
        minQuantity: number;
        maxQuantity: number;
        price: ProductPrice;
      }>
    >;
    catalogPriceRange: (
      product: Product,
      params: {
        country: string;
        currency: string;
        includeInactive?: boolean;
        quantity?: number;
        vectors: Array<ProductConfiguration>;
      },
    ) => Promise<ProductPriceRange>;

    simulatedPriceRange: (
      prodct: Product,
      params: {
        userId: string;
        country: string;
        currency: string;
        includeInactive?: boolean;
        quantity?: number;
        useNetPrice?: boolean;
        vectors: Array<ProductConfiguration>;
      },
      unchainedAPI: UnchainedCore,
    ) => Promise<ProductPriceRange>;

    rates: {
      getRate(
        baseCurrency: Currency,
        quoteCurrency: Currency,
        referenceDate?: Date,
      ): Promise<{ rate: number; expiresAt: Date } | null>;
      getRateRange(
        baseCurrency: Currency,
        quoteCurrency: Currency,
        referenceDate?: Date,
      ): Promise<{ min: number; max: number } | null>;
      updateRates(rates: Array<ProductPriceRate>): Promise<boolean>;
    };
  };

  // Product adapter

  calculate: (
    pricingContext: ProductPricingContext & { item: OrderPosition },
    unchainedAPI: UnchainedCore,
  ) => Promise<Array<ProductPricingCalculation>>;

  // Mutations
  create: (doc: Product, options?: { autopublish?: boolean }) => Promise<Product>;

  delete: (productId: string) => Promise<number>;
  firstActiveProductProxy: (productId: string) => Promise<Product>;
  firstActiveProductBundle: (productId: string) => Promise<Product>;
  deleteProductPermanently: (
    params: { productId: string },
    options?: { keepReviews: boolean },
  ) => Promise<number>;

  update: (productId: string, doc: mongodb.UpdateFilter<Product>) => Promise<string>;

  publish: (product: Product) => Promise<boolean>;
  unpublish: (product: Product) => Promise<boolean>;

  /*
   * Product bundle items
   */

  bundleItems: {
    addBundleItem: (productId: string, doc: ProductBundleItem) => Promise<string>;
    removeBundleItem: (productId: string, index: number) => Promise<ProductBundleItem>;
  };

  /*
   * Product assignments
   */

  assignments: {
    addProxyAssignment: (
      productId: string,
      params: { proxyId: string; vectors: Array<ProductConfiguration> },
    ) => Promise<string>;
    removeAssignment: (
      productId: string,
      params: { vectors: Array<ProductConfiguration> },
    ) => Promise<number>;
  };

  /*
   * Product sub entities (Media, Variations & Reviews)
   */
  media: ProductMediaModule;
  reviews: ProductReviewsModule;
  variations: ProductVariationsModule;

  /*
   * Product search
   */

  search: {
    buildActiveStatusFilter: () => mongodb.Filter<Product>;
    buildActiveDraftStatusFilter: () => mongodb.Filter<Product>;
    countFilteredProducts: (params: {
      productIds: Array<string>;
      productSelector: mongodb.Filter<Product>;
    }) => Promise<number>;
    findFilteredProducts: (params: {
      limit?: number;
      offset?: number;
      productIds: Array<string>;
      productSelector: mongodb.Filter<Product>;
      sort?: mongodb.FindOptions['sort'];
    }) => Promise<Array<Product>>;
  };

  /*
   * Product texts
   */

  texts: {
    // Queries
    findTexts: (
      query: mongodb.Filter<ProductText>,
      options?: mongodb.FindOptions,
    ) => Promise<Array<ProductText>>;

    findLocalizedText: (params: { productId: string; locale?: string }) => Promise<ProductText>;

    // Mutations
    updateTexts: (
      productId: string,
      texts: Array<Omit<ProductText, 'productId'>>,
    ) => Promise<Array<ProductText>>;

    makeSlug: (data: { slug?: string; title: string; productId: string }) => Promise<string>;

    deleteMany: ({
      productId,
    }: {
      productId?: string;
      excludedProductIds?: string[];
    }) => Promise<number>;
  };
};

export const configureProductsModule = async ({
  db,
  options: productsOptions = {},
  migrationRepository,
}: ModuleInput<ProductsSettingsOptions>): Promise<ProductsModule> => {
  registerEvents(PRODUCT_EVENTS);
  await productsSettings.configureSettings(productsOptions);

  const { Products, ProductTexts } = await ProductsCollection(db);

  const mutations = generateDbMutations<Product>(Products, ProductsSchema) as ModuleMutations<Product>;
  addMigrations(migrationRepository);

  /*
   * Product sub entities
   */

  const productTexts = configureProductTextsModule({
    Products,
    ProductTexts,
  });

  const productMedia = await configureProductMediaModule({ db });
  const productReviews = await configureProductReviewsModule({ db });
  const productVariations = await configureProductVariationsModule({ db });

  const deleteProductPermanently: ProductsModule['deleteProductPermanently'] = async (
    { productId },
    options,
  ) => {
    const selector: mongodb.Filter<Product> = generateDbFilterById(productId, {
      status: ProductStatus.DELETED,
    });

    await productMedia.deleteMediaFiles({ productId });
    await productTexts.deleteMany({ productId });
    await productVariations.deleteVariations({ productId });
    if (!options?.keepReviews) {
      await productReviews.deleteMany({ productId });
    }

    const deletedResult = await Products.deleteOne(selector);

    return deletedResult.deletedCount;
  };

  const publishProduct: ProductsModule['publish'] = async (product) => {
    if (product.status === InternalProductStatus.DRAFT) {
      await Products.updateOne(generateDbFilterById(product._id), {
        $set: {
          status: ProductStatus.ACTIVE,
          updated: new Date(),
          published: new Date(),
        },
      });

      await emit('PRODUCT_PUBLISH', { product });

      return true;
    }

    return false;
  };

  const unpublishProduct: ProductsModule['unpublish'] = async (product) => {
    if (product.status === ProductStatus.ACTIVE) {
      await Products.updateOne(generateDbFilterById(product._id), {
        $set: {
          status: InternalProductStatus.DRAFT,
          updated: new Date(),
          published: null,
        },
      });

      await emit('PRODUCT_UNPUBLISH', { product });

      return true;
    }

    return false;
  };

  const proxyProducts: ProductsModule['proxyProducts'] = async (
    product,
    vectors = [],
    { includeInactive = false } = {},
  ) => {
    const { proxy } = product;
    let filtered = [...(proxy.assignments || [])];

    vectors.forEach(({ key, value }) => {
      filtered = filtered.filter((assignment) => {
        if (assignment.vector[key] === value) {
          return true;
        }
        return false;
      });
    });
    const productIds = filtered.map((filteredAssignment) => filteredAssignment.productId);
    const selector: mongodb.Filter<Product> = {
      _id: { $in: productIds },
      status: includeInactive
        ? { $in: [ProductStatus.ACTIVE, InternalProductStatus.DRAFT] }
        : ProductStatus.ACTIVE,
    };
    return Products.find(selector).toArray();
  };

  /*
   * Product
   */

  return {
    // Queries
    findProduct: async ({ productId, slug, sku }) => {
      if (sku) {
        return Products.findOne({ 'warehousing.sku': sku }, { sort: { sequence: 1 } });
      }
      const selector = productId ? generateDbFilterById(productId) : { slugs: slug };
      return Products.findOne(selector, {});
    },

    findProducts: async ({ limit, offset, sort, ...query }) => {
      const defaultSortOption: Array<SortOption> = [
        { key: 'sequence', value: SortDirection.ASC },
        { key: 'published', value: SortDirection.DESC },
      ];
      const products = Products.find(buildFindSelector(query), {
        limit,
        skip: offset,
        sort: buildSortOptions(sort || defaultSortOption),
      });
      return products.toArray();
    },

    count: async (query) => {
      return Products.countDocuments(buildFindSelector(query));
    },

    productExists: async ({ productId, slug }) => {
      const selector: mongodb.Filter<Product> = productId
        ? generateDbFilterById(productId)
        : { slugs: slug };
      selector.status = { $in: [ProductStatus.ACTIVE, InternalProductStatus.DRAFT] };

      const productCount = await Products.countDocuments(selector, { limit: 1 });

      return !!productCount;
    },

    // Transformations
    interface: (productDiscount) => {
      return ProductDiscountDirector.getAdapter(productDiscount.discountKey);
    },

    isActive: (product) => {
      return product.status === ProductStatus.ACTIVE;
    },
    isDraft: (product) => {
      return product.status === ProductStatus.DRAFT || product.status === InternalProductStatus.DRAFT;
    },

    normalizedStatus: (product) => {
      return product.status === null ? ProductStatus.DRAFT : (product.status as ProductStatus);
    },

    pricingSheet: (params) => {
      return ProductPricingSheet(params);
    },

    proxyAssignments: async (product, { includeInactive = false } = {}) => {
      const assignments = product.proxy?.assignments || [];

      const productIds = assignments.map(({ productId }) => productId);
      const selector: mongodb.Filter<Product> = {
        _id: { $in: productIds },
        status: includeInactive
          ? { $in: [ProductStatus.ACTIVE, InternalProductStatus.DRAFT] }
          : ProductStatus.ACTIVE,
      };
      const supportedProductIds = await Products.find(selector, {
        projection: { _id: 1 },
      })
        .map(({ _id }) => _id)
        .toArray();

      return assignments
        .filter(({ productId }) => {
          return supportedProductIds.includes(productId);
        })
        .map((assignment) => ({
          assignment,
          product,
        }));
    },

    proxyProducts,

    resolveOrderableProduct: async (product, { configuration }, unchainedAPI) => {
      const { modules } = unchainedAPI;
      const productId = product._id as string;

      if (product.type === ProductTypes.ConfigurableProduct) {
        const variations = await modules.products.variations.findProductVariations({
          productId,
        });
        const vectors = configuration?.filter(({ key: configurationKey }) => {
          const isKeyEqualsVariationKey = Boolean(
            variations.filter(({ key: variationKey }) => variationKey === configurationKey).length,
          );
          return isKeyEqualsVariationKey;
        });

        const variants = await modules.products.proxyProducts(product, vectors, {
          includeInactive: false,
        });
        if (variants.length !== 1) {
          throw new Error(
            'There needs to be exactly one variant left when adding a ConfigurableProduct to the cart, configuration not distinct enough',
          );
        }

        const resolvedProduct = variants[0];
        return resolvedProduct;
      }
      return product;
    },

    prices: configureProductPricesModule({ proxyProducts, db }),

    // Product adapter
    calculate: async (pricingContext, unchainedAPI) => {
      const director = await ProductPricingDirector.actions(pricingContext, unchainedAPI);

      return director.calculate();
    },

    // Mutations
    create: async ({ type, sequence, ...productData }) => {
      if (productData._id) {
        await deleteProductPermanently(
          {
            productId: productData._id as string,
          },
          { keepReviews: true },
        );
      }

      const productId = await mutations.create({
        type: ProductTypes[type],
        status: InternalProductStatus.DRAFT,
        sequence: sequence ?? (await Products.countDocuments({})) + 10,
        ...productData,
      });

      const product = await Products.findOne(generateDbFilterById(productId), {});
      await emit('PRODUCT_CREATE', { product });

      return product;
    },

    update: async (_id, doc) => {
      const updateDoc = doc;
      if (doc.type) {
        updateDoc.type = ProductTypes[doc.type];
      }

      const productId = await mutations.update(_id, updateDoc);

      const product = await Products.findOne(generateDbFilterById(productId), {});

      // Deprecation notice: remove "...updateDoc", product should be inside product field
      await emit('PRODUCT_UPDATE', { productId, ...updateDoc, product });

      return productId;
    },
    firstActiveProductProxy: async (productId) => {
      return Products.findOne({ 'proxy.assignments.productId': productId });
    },
    firstActiveProductBundle: async (productId) => {
      return Products.findOne({ 'bundleItems.productId': productId });
    },
    delete: async (productId) => {
      const product = await Products.findOne(generateDbFilterById(productId), {});
      if (product.status !== InternalProductStatus.DRAFT) {
        throw new Error(`Invalid status', ${product.status}`);
      }

      const updatedResult = await Products.updateOne(generateDbFilterById(productId), {
        $set: {
          status: ProductStatus.DELETED,
          updated: new Date(),
        },
      });

      await emit('PRODUCT_REMOVE', { productId });

      return updatedResult.modifiedCount;
    },

    deleteProductPermanently,

    publish: publishProduct,
    unpublish: unpublishProduct,

    /*
     * Sub entities
     */

    assignments: {
      addProxyAssignment: async (productId, { proxyId, vectors }) => {
        const vector = {};
        vectors.forEach(({ key, value }) => {
          vector[key] = value;
        });
        const modifier = {
          $set: {
            updated: new Date(),
          },
          $push: {
            'proxy.assignments': {
              vector,
              productId,
            },
          },
        };

        await Products.updateOne(generateDbFilterById(proxyId), modifier);

        await emit('PRODUCT_ADD_ASSIGNMENT', { productId, proxyId });

        return proxyId;
      },

      removeAssignment: async (productId, { vectors }) => {
        const vector = {};
        vectors.forEach(({ key, value }) => {
          vector[key] = value;
        });
        const modifier = {
          $set: {
            updated: new Date(),
          },
          $pull: {
            'proxy.assignments': {
              vector,
            },
          },
        };
        await Products.updateOne(generateDbFilterById(productId), modifier);

        await emit('PRODUCT_REMOVE_ASSIGNMENT', { productId });

        return vectors.length;
      },
    },

    bundleItems: {
      addBundleItem: async (productId, doc) => {
        await Products.updateOne(generateDbFilterById(productId), {
          $set: {
            updated: new Date(),
          },
          $push: {
            bundleItems: doc,
          },
        });

        await emit('PRODUCT_CREATE_BUNDLE_ITEM', { productId });

        return productId;
      },

      removeBundleItem: async (productId, index) => {
        const product = await Products.findOne(generateDbFilterById(productId), {});

        const { bundleItems = [] } = product;
        const removedItems = bundleItems.splice(index, 1);
        const removedItem = removedItems.length === 1 ? removedItems[0] : null;

        if (removedItem) {
          await Products.updateOne(generateDbFilterById(productId), {
            $set: {
              updated: new Date(),
              bundleItems,
            },
          });
        }

        await emit('PRODUCT_REMOVE_BUNDLE_ITEM', {
          productId,
          item: removedItem,
        });

        return removedItem;
      },
    },

    media: productMedia,
    reviews: productReviews,
    variations: productVariations,

    search: {
      buildActiveDraftStatusFilter: () => ({
        status: { $in: [ProductStatus.ACTIVE, InternalProductStatus.DRAFT] },
      }),
      buildActiveStatusFilter: () => ({
        status: { $in: [ProductStatus.ACTIVE] },
      }),
      countFilteredProducts: async ({ productIds, productSelector }) => {
        return Products.countDocuments({
          ...productSelector,
          _id: { $in: productIds },
        });
      },
      findFilteredProducts: async ({ limit, offset, productIds, productSelector, sort }) => {
        return findPreservingIds(Products)(productSelector, productIds, {
          skip: offset,
          limit,
          sort,
        });
      },
    },

    texts: productTexts,
  };
};
