import { Query } from '@unchainedshop/types/common';
import { ModuleInput, ModuleMutations } from '@unchainedshop/types/core';

import {
  Product,
  ProductQuery,
  ProductsModule,
  ProductsSettingsOptions,
} from '@unchainedshop/types/products';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  findPreservingIds,
  generateDbFilterById,
  generateDbMutations,
  buildSortOptions,
} from '@unchainedshop/utils';
import { SortDirection, SortOption } from '@unchainedshop/types/api';

import { configureEnrollmentsModule } from '@unchainedshop/core-enrollments';

import { ProductDiscountDirector } from '../director/ProductDiscountDirector';
import { ProductsCollection } from '../db/ProductsCollection';
import { ProductsSchema, ProductTypes } from '../db/ProductsSchema';
import { ProductStatus } from '../db/ProductStatus';
import { ProductPricingSheet } from '../director/ProductPricingSheet';
import { ProductPricingDirector } from '../products-index';
import { configureProductMediaModule } from './configureProductMediaModule';
import { configureProductPricesModule } from './configureProductPrices';
import { configureProductReviewsModule } from './configureProductReviewsModule';
import { configureProductTextsModule } from './configureProductTextsModule';
import { configureProductVariationsModule } from './configureProductVariationsModule';
import { productsSettings } from '../products-settings';
import addMigrations from '../migrations/addMigrations';

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

const buildFindSelector = ({
  slugs,
  tags,
  includeDrafts = false,
  productIds,
  productSelector,
  queryString,
  ...query
}: ProductQuery) => {
  const selector: Query = productSelector ? { ...productSelector, ...query } : query;

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
    selector.$text = { $search: queryString };
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
  const enrollmentModule = await configureEnrollmentsModule({ db });

  const productReviews = await configureProductReviewsModule({ db });
  const productVariations = await configureProductVariationsModule({ db });

  const deleteProductPermanently: ProductsModule['deleteProductPermanently'] = async ({ productId }) => {
    const selector: Query = generateDbFilterById(productId, { status: ProductStatus.DELETED });

    await productMedia.deleteMediaFiles({ productId });
    await productTexts.deleteMany({ productId });
    await productReviews.deleteMany({ productId });
    await productVariations.deleteVariations({ productId });

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
    const selector: Query = {
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
      const selector: Query = productId ? generateDbFilterById(productId) : { slugs: slug };
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
      const selector: Query = {
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
    create: async (
      { locale, title, type, sequence, ...productData },
      userId,
      { autopublish = false } = {},
    ) => {
      if (productData._id) {
        await deleteProductPermanently({
          productId: productData._id as string,
        });
      }

      const productId = await mutations.create({
        type: ProductTypes[type],
        status: InternalProductStatus.DRAFT,
        sequence: sequence ?? (await Products.countDocuments({})) + 10,
        ...productData,
      });

      const product = await Products.findOne(generateDbFilterById(productId), {});

      if (locale) {
        await productTexts.upsertLocalizedText(productId, locale, { title });

        if (autopublish) {
          await publishProduct(product);
        }
      }

      await emit('PRODUCT_CREATE', { product });

      return product;
    },

    update: async (_id, doc) => {
      const updateDoc = doc;
      if (doc.type) {
        updateDoc.type = ProductTypes[doc.type];
      }

      const productId = await mutations.update(_id, updateDoc);

      await emit('PRODUCT_UPDATE', { productId, ...updateDoc });

      return productId;
    },

    delete: async (productId) => {
      const product = await Products.findOne(generateDbFilterById(productId), {});

      const activeLinks = await Products.findOne(
        {
          $or: [{ 'proxy.assignments.productId': productId }, { 'bundleItems.productId': productId }],
          status: { $ne: 'DELETED' },
        },
        { projection: { _id: 1, proxy: 1, bundleItems: 1 } },
      );
      if (
        activeLinks?.proxy?.assignments?.some(
          ({ productId: variantProductId }) => variantProductId === productId,
        )
      )
        throw new Error('ProductLinkedToActiveVariationError');

      if (
        activeLinks?.bundleItems?.some(
          ({ productId: bundledProductId }) => bundledProductId === productId,
        )
      )
        throw new Error('ProductLinkedToActiveBundleError');

      const hasActiveEnrollment = await enrollmentModule.enrollmentExistsForProduct({
        productId,
      });

      if (hasActiveEnrollment) throw new Error('ProductLinkedToEnrollmentError');

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
