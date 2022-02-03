import { Context } from '@unchainedshop/types/api';
import { FindOptions, ModuleInput, ModuleMutations, Query } from '@unchainedshop/types/common';
import { Product, ProductQuery, ProductsModule } from '@unchainedshop/types/products';
import { emit, registerEvents } from 'meteor/unchained:events';
import { findPreservingIds, generateDbFilterById, generateDbMutations } from 'meteor/unchained:utils';
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

const PRODUCT_EVENTS = ['PRODUCT_CREATE', 'PRODUCT_REMOVE', 'PRODUCT_SET_BASE', 'PRODUCT_UPDATE', 'PRODUCT_PUBLISH', 'PRODUCT_UNPUBLISH'];

const InternalProductStatus = {
  DRAFT: null,
};

const buildFindSelector = ({
  slugs = [],
  tags = [],
  includeDrafts = false,
  productIds = [],
  productSelector,
  ...query
}: ProductQuery) => {
  const selector: Query = productSelector ? { ...productSelector, ...query } : query;

  if (productIds?.length > 0) {
    selector._id = { $in: productIds };
  }

  if (slugs?.length > 0) {
    selector.slugs = { $in: slugs };
  } else if (Array.isArray(tags) && tags?.length > 0) {
    selector.tags = { $all: tags };
  }

  if (!includeDrafts) {
    selector.status = { $eq: ProductStatus.ACTIVE };
  } else {
    selector.status = {
      $in: [ProductStatus.ACTIVE, InternalProductStatus.DRAFT],
    };
  }

  return selector;
};

export const configureProductsModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<ProductsModule> => {
  registerEvents(PRODUCT_EVENTS);

  const { Products, ProductTexts } = await ProductsCollection(db);

  const mutations = generateDbMutations<Product>(Products, ProductsSchema) as ModuleMutations<Product>;

  const checkIsActive = (product: Product, { modules }: Context) => {
    if (!modules.products.isActive(product)) {
      throw new Error('This product is not available for ordering at the moment');
    }
  };

  const deleteProductsPermanently: ProductsModule['deleteProductsPermanently'] = async ({
    productId,
    excludedProductIds,
  }) => {
    const selector: Query = productId
      ? generateDbFilterById(productId, { status: ProductStatus.DELETED })
      : { _id: { $nin: excludedProductIds } };
    const deletedResult = await Products.deleteOne(selector);

    return deletedResult.deletedCount;
  };

  const publishProduct: ProductsModule['publish'] = async (product, userId) => {
    if (product.status === InternalProductStatus.DRAFT) {
      await Products.updateOne(generateDbFilterById(product._id), {
        $set: {
          status: ProductStatus.ACTIVE,
          updated: new Date(),
          updatedBy: userId,
          published: new Date(),
        },
      });

      emit('PRODUCT_PUBLISH', { product: this });

      return true;
    }

    return false;
  };

  const unpublishProduct: ProductsModule['unpublish'] = async (product, userId) => {
    if (product.status === ProductStatus.ACTIVE) {
      await Products.updateOne(generateDbFilterById(product._id), {
        $set: {
          status: InternalProductStatus.DRAFT,
          updated: new Date(),
          updatedBy: userId,
          published: null,
        },
      });

      emit('PRODUCT_UNPUBLISH', { product: this });

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
   * Product sub entities
   */

  const productTexts = configureProductTextsModule({
    Products,
    ProductTexts,
  });

  /*
   * Product
   */

  return {
    // Queries
    findProduct: async ({ productId, slug }) => {
      const selector = productId ? generateDbFilterById(productId) : { slugs: slug };
      return Products.findOne(selector, {});
    },

    findProducts: async ({ limit, offset, ...query }) => {
      const options: FindOptions = { sort: { sequence: 1, published: -1 } };

      if (!query.slugs?.length) {
        options.skip = offset;
        options.limit = limit;
      }

      const products = Products.find(buildFindSelector(query), options);

      return products.toArray();
    },

    findProductSiblings: async ({ productIds, limit, offset, includeInactive = false }) => {
      const productSelector: Query = {
        _id: { $in: productIds },
        status: includeInactive
          ? { $in: [ProductStatus.ACTIVE, InternalProductStatus.DRAFT] }
          : ProductStatus.ACTIVE,
      };

      const productOptions = { skip: offset, limit };

      return Products.find(productSelector, productOptions).toArray();
    },

    count: async (query) => {
      return Products.find(buildFindSelector(query)).count();
    },

    productExists: async ({ productId, slug }) => {
      const selector: Query = productId ? generateDbFilterById(productId) : { slugs: slug };
      selector.status = { $ne: ProductStatus.DELETED };

      const productCount = await Products.find(selector, { limit: 1 }).count();

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
          product: this,
        }));
    },

    proxyProducts,

    resolveOrderableProduct: async (product, { configuration }, requestContext) => {
      const { modules } = requestContext;
      const productId = product._id as string;

      checkIsActive(product, requestContext);

      if (product.type === ProductTypes.ConfigurableProduct) {
        const variations = await modules.products.variations.findProductVariations({
          productId,
        });
        const vectors = configuration.filter(({ key: configurationKey }) => {
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
        checkIsActive(resolvedProduct, requestContext);
        return resolvedProduct;
      }
      return product;
    },

    prices: configureProductPricesModule({ proxyProducts }),

    // Product adapter
    calculate: async (pricingContext, requestContext) => {
      const director = await ProductPricingDirector.actions(pricingContext, requestContext);

      return director.calculate();
    },

    // Mutations
    create: async (
      { locale, title, type, sequence, authorId, ...productData },
      userId,
      { autopublish = false } = {},
    ) => {
      if (productData._id) {
        // Remove deleted product by _id before creating a new one.
        await deleteProductsPermanently({
          productId: productData._id as string,
        });
      }

      const productId = await mutations.create(
        {
          type: ProductTypes[type],
          status: InternalProductStatus.DRAFT,
          sequence: sequence ?? (await Products.find({}).count()) + 10,
          authorId,
          ...productData,
        },
        userId,
      );

      const product = await Products.findOne(generateDbFilterById(productId), {});

      if (locale) {
        productTexts.upsertLocalizedText(
          productId,
          locale,
          { productId, title, authorId, locale },
          userId,
        );

        if (autopublish) {
          await publishProduct(product, userId);
        }
      }

      emit('PRODUCT_CREATE', { product });

      return product;
    },

    update: async (_id, doc, userId) => {
      const updateDoc = doc;
      if (doc.type) {
        updateDoc.type = ProductTypes[doc.type];
      }

      const productId = await mutations.update(_id, updateDoc, userId);

      emit('PRODUCT_UPDATE', { productId, ...doc });

      return productId;
    },

    delete: async (productId, userId) => {
      const product = await Products.findOne(generateDbFilterById(productId), {});

      if (product.status !== InternalProductStatus.DRAFT) {
        throw new Error(`Invalid status', ${product.status}`);
      }

      const updatedResult = await Products.updateOne(generateDbFilterById(productId), {
        $set: {
          status: ProductStatus.DELETED,
          updated: new Date(),
          updatedBy: userId,
        },
      });

      emit('PRODUCT_REMOVE', { productId });

      return updatedResult.modifiedCount;
    },

    deleteProductsPermanently,

    publish: publishProduct,
    unpublish: unpublishProduct,

    /*
     * Sub entities
     */

    assignments: {
      addProxyAssignment: async (productId, { proxyId, vectors }, userId) => {
        const vector = {};
        vectors.forEach(({ key, value }) => {
          vector[key] = value;
        });
        const modifier = {
          $set: {
            updated: new Date(),
            updatedBy: userId,
          },
          $push: {
            'proxy.assignments': {
              vector,
              productId,
            },
          },
        };

        await Products.updateOne(generateDbFilterById(proxyId), modifier);

        emit('PRODUCT_ADD_ASSIGNMENT', { productId, proxyId });

        return proxyId;
      },

      removeAssignment: async (productId, { vectors }, userId) => {
        const vector = {};
        vectors.forEach(({ key, value }) => {
          vector[key] = value;
        });
        const modifier = {
          $set: {
            updated: new Date(),
            updatedBy: userId,
          },
          $pull: {
            'proxy.assignments': {
              vector,
            },
          },
        };
        await Products.updateOne(generateDbFilterById(productId), modifier);

        emit('PRODUCT_REMOVE_ASSIGNMENT', { productId });

        return vectors.length;
      },
    },

    bundleItems: {
      addBundleItem: async (productId, doc, userId) => {
        await Products.updateOne(generateDbFilterById(productId), {
          $set: {
            updated: new Date(),
            updatedBy: userId,
          },
          $push: {
            bundleItems: doc,
          },
        });

        emit('PRODUCT_CREATE_BUNDLE_ITEM', { productId });

        return productId;
      },

      removeBundleItem: async (productId, index, userId) => {
        // TODO: There has to be a better MongoDB way to do this!
        const product = await Products.findOne(generateDbFilterById(productId), {});

        const { bundleItems = [] } = product;
        const removedItems = bundleItems.splice(index, 1);
        const removedItem = removedItems.length === 1 ? removedItems[0] : null;

        if (removedItem) {
          await Products.updateOne(generateDbFilterById(productId), {
            $set: {
              updated: new Date(),
              updatedBy: userId,
              bundleItems,
            },
          });
        }

        emit('PRODUCT_REMOVE_BUNDLE_ITEM', {
          productId,
          item: removedItem,
        });

        return removedItem;
      },
    },

    media: await configureProductMediaModule({ db }),
    reviews: await configureProductReviewsModule({ db }),
    variations: await configureProductVariationsModule({ db }),

    search: {
      buildActiveDraftStatusFilter: () => ({
        status: { $in: [ProductStatus.ACTIVE, InternalProductStatus.DRAFT] },
      }),
      buildActiveStatusFilter: () => ({
        status: { $in: [ProductStatus.ACTIVE, InternalProductStatus.DRAFT] },
      }),
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
