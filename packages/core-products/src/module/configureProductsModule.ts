import { emit, registerEvents } from '@unchainedshop/events';
import {
  findPreservingIds,
  generateDbFilterById,
  buildSortOptions,
  mongodb,
  generateDbObjectId,
  ModuleInput,
  assertDocumentDBCompatMode,
} from '@unchainedshop/mongodb';
import { SortDirection, SortOption, Price } from '@unchainedshop/utils';
import {
  Product,
  ProductAssignment,
  ProductBundleItem,
  ProductConfiguration,
  ProductsCollection,
  ProductStatus,
  ProductTypes,
} from '../db/ProductsCollection.js';
import { configureProductMediaModule } from './configureProductMediaModule.js';
import { configureProductPricesModule } from './configureProductPrices.js';
import { configureProductReviewsModule } from './configureProductReviewsModule.js';
import { configureProductTextsModule } from './configureProductTextsModule.js';
import { configureProductVariationsModule } from './configureProductVariationsModule.js';
import { productsSettings, ProductsSettingsOptions } from '../products-settings.js';

export interface ProductQuery {
  queryString?: string;
  includeDrafts?: boolean;
  productIds?: string[];
  productSelector?: mongodb.Filter<Product>;
  slugs?: string[];
  tags?: string[];
}

export interface ProductDiscount {
  _id: string;
  productId: string;
  code: string;
  total?: Price;
  discountKey: string;
  context?: any;
}

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

  if (productIds && !selector._id) {
    selector._id = { $in: productIds };
  }

  if (slugs && !selector.slugs) {
    selector.slugs = { $in: slugs };
  }

  if (tags && !selector.tags) {
    if (Array.isArray(tags)) {
      selector.tags = { $all: tags };
    } else {
      selector.tags = tags;
    }
  }

  if (queryString && !selector.$text) {
    assertDocumentDBCompatMode();
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

export const configureProductsModule = async (moduleInput: ModuleInput<ProductsSettingsOptions>) => {
  const { db, options: productsOptions = {} } = moduleInput;

  registerEvents(PRODUCT_EVENTS);
  await productsSettings.configureSettings(productsOptions);

  const { Products, ProductTexts } = await ProductsCollection(db);

  /*
   * Product sub entities
   */

  const productTexts = configureProductTextsModule({
    Products,
    ProductTexts,
  });

  const productMedia = await configureProductMediaModule(moduleInput);
  const productReviews = await configureProductReviewsModule(moduleInput);
  const productVariations = await configureProductVariationsModule(moduleInput);

  const deleteProductPermanently = async (
    { productId }: { productId: string },
    options?: { keepReviews: boolean },
  ): Promise<number> => {
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

  const publishProduct = async (product: Product): Promise<boolean> => {
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

  const unpublishProduct = async (product: Product): Promise<boolean> => {
    if (product.status === ProductStatus.ACTIVE) {
      const result = await Products.updateOne(generateDbFilterById(product._id), {
        $set: {
          status: InternalProductStatus.DRAFT,
          updated: new Date(),
        },
        $unset: {
          published: 1,
        },
      });

      await emit('PRODUCT_UNPUBLISH', { product });

      return Boolean(result.modifiedCount);
    }

    return false;
  };

  const proxyProducts = async (
    product: Product,
    vectors: ProductConfiguration[] = [],
    { includeInactive = false }: { includeInactive?: boolean } = {},
  ): Promise<Product[]> => {
    const { proxy } = product;
    let filtered = [...(proxy?.assignments || [])];
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
    findProduct: async (
      params:
        | {
            productId: string;
          }
        | {
            slug: string;
          }
        | {
            sku: string;
          },
    ): Promise<Product | null> => {
      if ('sku' in params) {
        return Products.findOne({ 'warehousing.sku': params.sku }, { sort: { sequence: 1 } });
      }
      if ('slug' in params && params.slug != null) {
        return Products.findOne({ slugs: params.slug }, {});
      }
      if ('productId' in params && params.productId != null) {
        return Products.findOne(generateDbFilterById(params.productId), {});
      }
      return null;
    },

    findProducts: async (
      {
        limit,
        offset,
        sort,
        ...query
      }: ProductQuery & {
        limit?: number;
        offset?: number;
        sort?: SortOption[];
      },
      options?: mongodb.FindOptions,
    ): Promise<Product[]> => {
      const defaultSortOption: SortOption[] = [
        { key: 'sequence', value: SortDirection.ASC },
        { key: 'published', value: SortDirection.DESC },
      ];
      const products = Products.find(buildFindSelector(query), {
        ...(options || {}),
        limit,
        skip: offset,
        sort: buildSortOptions(sort || defaultSortOption),
      });
      return products.toArray();
    },

    findProductIds: async (query: ProductQuery): Promise<string[]> => {
      return Products.distinct('_id', buildFindSelector(query));
    },

    count: async (query: ProductQuery) => {
      return Products.countDocuments(buildFindSelector(query));
    },

    productExists: async ({ productId, slug }: { productId?: string; slug?: string }) => {
      const selector: mongodb.Filter<Product> = productId
        ? generateDbFilterById(productId)
        : { slugs: slug };
      selector.status = { $in: [ProductStatus.ACTIVE, InternalProductStatus.DRAFT] };

      const productCount = await Products.countDocuments(selector, { limit: 1 });

      return !!productCount;
    },

    isActive: (product: Product) => {
      return product.status === ProductStatus.ACTIVE;
    },
    isDraft: (product: Product) => {
      return product.status === ProductStatus.DRAFT || product.status === InternalProductStatus.DRAFT;
    },
    normalizedStatus: (product: Product): ProductStatus => {
      return product.status === null ? ProductStatus.DRAFT : (product.status as ProductStatus);
    },

    proxyAssignments: async (
      product: Product,
      { includeInactive = false }: { includeInactive?: boolean } = {},
    ): Promise<{ assignment: ProductAssignment; product: Product }[]> => {
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

    resolveOrderableProduct: async (
      product: Product,
      { configuration }: { configuration?: ProductConfiguration[] },
    ): Promise<Product> => {
      const productId = product._id as string;

      if (product.type === ProductTypes.ConfigurableProduct) {
        const variations = await productVariations.findProductVariations({
          productId,
        });
        const vectors = configuration?.filter(({ key: configurationKey }) => {
          const isKeyEqualsVariationKey = Boolean(
            variations.filter(({ key: variationKey }) => variationKey === configurationKey).length,
          );
          return isKeyEqualsVariationKey;
        });

        const variants = await proxyProducts(product, vectors, {
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

    // Mutations
    create: async ({
      type,
      sequence,
      ...productData
    }: Omit<Product, '_id' | 'created' | 'updated' | 'deleted' | 'slugs'> &
      Pick<Partial<Product>, '_id' | 'created' | 'updated' | 'deleted'>): Promise<Product> => {
      if (productData._id) {
        await deleteProductPermanently(
          {
            productId: productData._id as string,
          },
          { keepReviews: true },
        );
      }

      const { insertedId: productId } = await Products.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        type: ProductTypes[type],
        status: InternalProductStatus.DRAFT,
        sequence: sequence ?? (await Products.countDocuments({})) + 10,
        slugs: [],
        ...productData,
      });

      const product = (await Products.findOne(generateDbFilterById(productId), {})) as Product;
      await emit('PRODUCT_CREATE', { product });

      return product;
    },

    update: async (productId: string, doc: mongodb.UpdateFilter<Product>): Promise<string> => {
      const updateDoc = doc;
      if (doc.type) {
        updateDoc.type = ProductTypes[doc.type];
      }

      const product = await Products.findOneAndUpdate(
        generateDbFilterById(productId),
        {
          $set: {
            updated: new Date(),
            ...updateDoc,
          },
        },
        { returnDocument: 'after' },
      );

      // Deprecation notice: remove "...updateDoc", product should be inside product field
      await emit('PRODUCT_UPDATE', { productId, ...updateDoc, product });

      return productId;
    },
    firstActiveProductProxy: async (productId: string) => {
      return Products.findOne({ 'proxy.assignments.productId': productId });
    },
    firstActiveProductBundle: async (productId: string) => {
      return Products.findOne({ 'bundleItems.productId': productId });
    },
    delete: async (productId: string) => {
      const deletedProduct = await Products.findOneAndUpdate(
        generateDbFilterById(productId),
        {
          $set: {
            status: ProductStatus.DELETED,
            updated: new Date(),
          },
        },
        { returnDocument: 'after' },
      );
      if (!deletedProduct) return null;
      await emit('PRODUCT_REMOVE', { productId });
      return deletedProduct;
    },

    deleteProductPermanently,

    publish: publishProduct,
    unpublish: unpublishProduct,

    /*
     * Sub entities
     */

    assignments: {
      addProxyAssignment: async ({
        productId,
        proxyId,
        vectors,
      }: {
        productId: string;
        proxyId: string;
        vectors: ProductConfiguration[];
      }): Promise<boolean> => {
        const assignment = {
          vector: Object.fromEntries(vectors.map(({ key, value }) => [key, value])),
          productId,
        };

        const modifier = {
          $set: {
            updated: new Date(),
          },
          $push: {
            'proxy.assignments': assignment,
          },
        };

        const updated = await Products.updateOne(
          generateDbFilterById(proxyId, {
            'proxy.assignments': {
              $not: {
                $elemMatch: {
                  vector: assignment.vector,
                },
              },
            },
          }),
          modifier,
        );

        if (updated.modifiedCount > 0) {
          await emit('PRODUCT_ADD_ASSIGNMENT', { productId, proxyId });
          return true;
        }

        return false;
      },

      removeAssignment: async (
        productId: string,
        { vectors }: { vectors: ProductConfiguration[] },
      ): Promise<number> => {
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

        await emit('PRODUCT_REMOVE_ASSIGNMENT', { productId, vectors });

        return vectors.length;
      },
    },

    bundleItems: {
      addBundleItem: async (productId: string, doc: ProductBundleItem): Promise<string> => {
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

      removeBundleItem: async (productId: string, index: number) => {
        const product = await Products.findOne(generateDbFilterById(productId), {});

        if (!product) return null;

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

    removeAllAssignmentsAndBundleItems: async (productId: string) => {
      return Products.findOneAndUpdate(
        generateDbFilterById(productId),
        {
          $set: {
            updated: new Date(),
          },
          $unset: {
            'proxy.assignments': '1',
            bundleItems: '1',
          },
        },
        { returnDocument: 'after' },
      );
    },

    media: productMedia,
    reviews: productReviews,
    variations: productVariations,

    search: {
      buildActiveDraftStatusFilter: (): mongodb.Filter<Product> => ({
        status: { $in: [ProductStatus.ACTIVE, InternalProductStatus.DRAFT] },
      }),
      buildActiveStatusFilter: (): mongodb.Filter<Product> => ({
        status: { $in: [ProductStatus.ACTIVE] },
      }),
      countFilteredProducts: async ({
        productIds,
        productSelector,
      }: {
        productIds: string[];
        productSelector: mongodb.Filter<Product>;
      }): Promise<number> => {
        return Products.countDocuments({
          ...productSelector,
          _id: { $in: productIds },
        });
      },
      findFilteredProducts: async ({
        limit,
        offset,
        productIds,
        productSelector,
        sort,
      }: {
        limit?: number;
        offset?: number;
        productIds: string[];
        productSelector: mongodb.Filter<Product>;
        sort?: mongodb.FindOptions['sort'];
      }): Promise<Product[]> => {
        return findPreservingIds(Products)(productSelector, productIds, {
          skip: offset,
          limit,
          sort,
        });
      },
    },

    texts: productTexts,
    existingTags: async (): Promise<string[]> => {
      const tags = await Products.distinct('tags', {
        tags: { $exists: true },
        status: { $ne: ProductStatus.DELETED },
      });
      return tags.filter(Boolean).toSorted();
    },
  };
};

export type ProductsModule = Awaited<ReturnType<typeof configureProductsModule>>;
