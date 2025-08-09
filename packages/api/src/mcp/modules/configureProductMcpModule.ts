import { Context } from '../../context.js';
import { Product, ProductText, ProductTypes } from '@unchainedshop/core-products';
import {
  ProductNotFoundError,
  ProductWrongStatusError,
  ProductWrongTypeError,
  ProductVariationNotFoundError,
  ProductMediaNotFoundError,
} from '../../errors.js';
import { getNormalizedProductDetails } from '../utils/getNormalizedProductDetails.js';
import normalizeMediaUrl from '../utils/normalizeMediaUrl.js';

export type ProductOperationType =
  | 'CREATE'
  | 'UPDATE'
  | 'REMOVE'
  | 'GET'
  | 'LIST'
  | 'COUNT'
  | 'UPDATE_STATUS'
  | 'ADD_MEDIA'
  | 'REMOVE_MEDIA'
  | 'REORDER_MEDIA'
  | 'GET_MEDIA'
  | 'CREATE_VARIATION'
  | 'REMOVE_VARIATION'
  | 'ADD_VARIATION_OPTION'
  | 'REMOVE_VARIATION_OPTION'
  | 'ADD_ASSIGNMENT'
  | 'REMOVE_ASSIGNMENT'
  | 'GET_ASSIGNMENTS'
  | 'GET_VARIATION_PRODUCTS'
  | 'ADD_BUNDLE_ITEM'
  | 'REMOVE_BUNDLE_ITEM'
  | 'GET_BUNDLE_ITEMS'
  | 'SIMULATE_PRICE'
  | 'SIMULATE_PRICE_RANGE'
  | 'GET_CATALOG_PRICE'
  | 'GET_PRODUCT_TEXTS'
  | 'GET_MEDIA_TEXTS'
  | 'GET_VARIATION_TEXTS'
  | 'UPDATE_MEDIA_TEXTS'
  | 'UPDATE_VARIATION_TEXTS'
  | 'GET_REVIEWS'
  | 'COUNT_REVIEWS'
  | 'GET_SIBLINGS';

export interface ProductEntity {
  type?: keyof typeof ProductTypes;
  tags?: string[];
  sequence?: number;
  meta?: Record<string, any>;
  plan?: any;
  warehousing?: {
    sku?: string;
    baseUnit?: string;
  };
  supply?: {
    weightInGram?: number;
    heightInMillimeters?: number;
    lengthInMillimeters?: number;
    widthInMillimeters?: number;
  };
  tokenization?: {
    contractAddress?: string;
    contractStandard?: string;
    tokenId?: string;
    supply?: number;
    ercMetadataProperties?: Record<string, any>;
  };
  commerce?: {
    pricing: {
      amount: number;
      maxQuantity?: number;
      isTaxable?: boolean;
      isNetPrice?: boolean;
      currencyCode: string;
      countryCode: string;
    }[];
  };
}

export interface ProductTextEntity {
  locale: string;
  slug?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  vendor?: string;
  brand?: string;
  labels?: string[];
}

export interface ProductVariationEntity {
  key: string;
  type: string;
  options?: string[];
}

export interface ProductVariationTextEntity {
  locale: string;
  title?: string;
  subtitle?: string;
}

export interface ProductMediaTextEntity {
  locale: string;
  title?: string;
  subtitle?: string;
}

export interface ProductAssignmentVector {
  key: string;
  value: string;
}

export interface ProductListOptions {
  limit?: number;
  offset?: number;
  tags?: string[];
  slugs?: string[];
  queryString?: string;
  includeDrafts?: boolean;
  sort?: {
    key: string;
    value: 'ASC' | 'DESC';
  }[];
}

export interface ProductCountOptions {
  tags?: string[];
  slugs?: string[];
  queryString?: string;
  includeDrafts?: boolean;
}

export interface ProductMediaOptions {
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface ProductReviewsOptions {
  limit?: number;
  offset?: number;
  queryString?: string;
  sort?: {
    key: string;
    value: 'ASC' | 'DESC';
  }[];
}

export const configureProductMcpModule = (context: Context) => {
  const { modules, services } = context;
  const extractVariationMatrix = (variations = []) => {
    const cartesianProduct = (arrays) => {
      return arrays.reduce(
        (acc, array) => acc.flatMap((item) => array.map((value) => [...item, value])),
        [[]],
      );
    };
    const keys = variations.map((item) => item.key);
    const options = variations.map((item) => item.options);
    const combinations = cartesianProduct(options);
    return combinations.map((combination) =>
      combination.reduce((acc, value, index) => {
        acc[keys[index]] = value;
        return acc;
      }, {}),
    );
  };

  const combinationExists = (matrix, combination) => {
    return matrix.some((variation) => {
      return (
        Object.keys(variation).length === Object.keys(combination).length &&
        Object.entries(combination).every(([key, value]) => variation[key] === value)
      );
    });
  };

  return {
    create: async (productEntity: ProductEntity, texts?: ProductTextEntity[]) => {
      const newProduct = await modules.products.create(productEntity as Product);
      let productTexts: any[] = [];

      if (texts && texts.length > 0) {
        productTexts = await modules.products.texts.updateTexts(
          newProduct._id,
          texts as unknown as ProductText[],
        );
      }

      return {
        product: {
          ...newProduct,
          texts: productTexts,
        },
      };
    },

    update: async (productId: string, productEntity: ProductEntity) => {
      const existingProduct = await modules.products.findProduct({ productId });
      if (!existingProduct) throw new ProductNotFoundError({ productId });

      const updateData: any = {};


      if (productEntity.tags !== undefined) updateData.tags = productEntity.tags;
      if (productEntity.sequence !== undefined) updateData.sequence = productEntity.sequence;
      if (productEntity.meta !== undefined) updateData.meta = productEntity.meta;


      if (productEntity.plan !== undefined) {
        if (existingProduct.type !== ProductTypes.PlanProduct) {
          throw new ProductWrongStatusError({
            received: existingProduct.type,
            required: ProductTypes.PlanProduct,
          });
        }
        updateData.plan = productEntity.plan;
      }

      if (productEntity.warehousing !== undefined) {
        if (existingProduct.type !== ProductTypes.SimpleProduct) {
          throw new ProductWrongTypeError({
            productId,
            received: existingProduct.type,
            required: ProductTypes.SimpleProduct,
          });
        }
        updateData.warehousing = productEntity.warehousing;
      }

      if (productEntity.supply !== undefined) {
        if (existingProduct.type !== ProductTypes.SimpleProduct) {
          throw new ProductWrongTypeError({
            productId,
            received: existingProduct.type,
            required: ProductTypes.SimpleProduct,
          });
        }
        updateData.supply = productEntity.supply;
      }

      if (productEntity.tokenization !== undefined) {
        if (existingProduct.type !== ProductTypes.TokenizedProduct) {
          throw new ProductWrongStatusError({
            received: existingProduct.type,
            required: ProductTypes.TokenizedProduct,
          });
        }
        updateData.tokenization = productEntity.tokenization;
      }

      if (productEntity.commerce !== undefined) {
        updateData.commerce = productEntity.commerce;
      }


      if (Object.keys(updateData).length > 0) {
        await modules.products.update(productId, updateData);
      }

      return await getNormalizedProductDetails(productId, context);
    },

    remove: async (productId: string) => {
      const product = await modules.products.findProduct({ productId });
      if (!product) throw new ProductNotFoundError({ productId });

      await modules.products.delete(productId);
      return product;
    },

    get: async (productId?: string, slug?: string, sku?: string) => {
      let query: any = {};
      if (productId) query = { productId };
      else if (slug) query = { slug };
      else if (sku) query = { sku };
      else throw new Error('Either productId, slug, or sku must be provided');

      const product = await modules.products.findProduct(query);
      if (!product) throw new ProductNotFoundError(query);

      return product;
    },

    list: async (options: ProductListOptions = {}) => {
      const { limit = 50, offset = 0, tags, slugs, queryString, includeDrafts = false, sort } = options;

      const sortOptions = sort?.map((s) => ({ key: s.key, value: s.value as any })) || undefined;

      return await modules.products.findProducts({
        limit,
        offset,
        tags,
        slugs,
        queryString,
        includeDrafts,
        sort: sortOptions,
      });
    },

    count: async (options: ProductCountOptions = {}) => {
      const { tags, slugs, queryString, includeDrafts = false } = options;

      return await modules.products.count({
        tags,
        slugs,
        queryString,
        includeDrafts,
      });
    },

    updateStatus: async (productId: string, action: 'PUBLISH' | 'UNPUBLISH') => {
      const product = await modules.products.findProduct({ productId });
      if (!product) throw new ProductNotFoundError({ productId });

      let success: boolean;
      if (action === 'PUBLISH') {
        success = await modules.products.publish(product);
      } else {
        success = await modules.products.unpublish(product);
      }

      if (!success) {
        throw new ProductWrongStatusError({ status: product.status });
      }

      return await getNormalizedProductDetails(productId, context);
    },

    addMedia: async (productId: string, mediaName: string, url: string) => {
      const product = await modules.products.findProduct({ productId });
      if (!product) throw new ProductNotFoundError({ productId });

      const {
        _id: fileId,
        putURL,
        type,
        size,
      } = await services.files.createSignedURL({
        directoryName: 'product-media',
        fileName: mediaName,
        meta: { productId },
      });

      const sourceResponse = await fetch(url);
      const uploadUrl = new URL(putURL, process.env.ROOT_URL || 'http://localhost:4010');
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: sourceResponse.body,
        duplex: 'half',
      } as RequestInit);

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      const file = await modules.files.findFile({ fileId });
      if (!file) throw new Error(`File not found: ${fileId}`);

      if (file.expires && new Date(file.expires).getTime() < Date.now()) {
        throw new Error(`File upload expired: ${fileId}`);
      }

      const linked = await services.files.linkFile({ fileId, size, type });
      return await normalizeMediaUrl([{ ...linked, mediaId: linked._id }], context);
    },

    removeMedia: async (productMediaId: string) => {
      const productMedia = await modules.products.media.findProductMedia({ productMediaId });
      if (!productMedia) throw new ProductMediaNotFoundError({ productMediaId });

      await modules.files.delete(productMedia.mediaId);
      await modules.products.media.delete(productMediaId);
      return { success: true };
    },

    reorderMedia: async (sortKeys: { productMediaId: string; sortKey: number }[]) => {
      return await modules.products.media.updateManualOrder({ sortKeys: sortKeys as any });
    },

    getMedia: async (productId: string, options: ProductMediaOptions = {}) => {
      const product = await modules.products.findProduct({ productId });
      if (!product) throw new ProductNotFoundError({ productId });

      const { tags, limit = 50, offset = 0 } = options;

      return await modules.products.media.findProductMedias({
        productId,
        tags,
        limit,
        offset,
      });
    },

    updateMediaTexts: async (productMediaId: string, texts: ProductMediaTextEntity[]) => {
      const media = await modules.products.media.findProductMedia({ productMediaId });
      if (!media) throw new ProductMediaNotFoundError({ productMediaId });

      return await modules.products.media.texts.updateMediaTexts(productMediaId, texts);
    },

    createVariation: async (
      productId: string,
      variation: ProductVariationEntity,
      texts?: ProductVariationTextEntity[],
    ) => {
      const product = await modules.products.findProduct({ productId });
      if (!product) throw new ProductNotFoundError({ productId });

      if (product.type !== ProductTypes.ConfigurableProduct) {
        throw new ProductWrongTypeError({
          productId,
          received: product.type,
          required: ProductTypes.ConfigurableProduct,
        });
      }

      const newVariation = await modules.products.variations.create({
        options: variation.options || [],
        productId,
        key: variation.key,
        type: variation.type,
      });

      if (texts && texts.length > 0) {
        await modules.products.variations.texts.updateVariationTexts(newVariation._id, texts as any);
      }

      return newVariation;
    },

    removeVariation: async (productVariationId: string) => {
      const variation = await modules.products.variations.findProductVariation({ productVariationId });
      if (!variation) throw new ProductVariationNotFoundError({ productVariationId });

      await modules.products.variations.delete(productVariationId);
      return variation;
    },

    addVariationOption: async (
      productVariationId: string,
      option: string,
      texts?: ProductVariationTextEntity[],
    ) => {
      const variation = await modules.products.variations.findProductVariation({ productVariationId });
      if (!variation) throw new ProductVariationNotFoundError({ productVariationId });

      const newOption = await modules.products.variations.addVariationOption(productVariationId, {
        value: option,
      });

      if (texts && texts.length > 0) {
        await modules.products.variations.texts.updateVariationTexts(
          productVariationId,
          texts as any,
          option,
        );
      }

      return newOption;
    },

    removeVariationOption: async (productVariationId: string, optionValue: string) => {
      const variation = await modules.products.variations.findProductVariation({ productVariationId });
      if (!variation) throw new ProductVariationNotFoundError({ productVariationId });

      await modules.products.variations.removeVariationOption(productVariationId, optionValue);
      return { productVariationId, removedOption: optionValue };
    },

    updateVariationTexts: async (
      productVariationId: string,
      texts: ProductVariationTextEntity[],
      optionValue?: string,
    ) => {
      const variation = await modules.products.variations.findProductVariation({ productVariationId });
      if (!variation) throw new ProductVariationNotFoundError({ productVariationId });

      return await modules.products.variations.texts.updateVariationTexts(
        productVariationId,
        texts as any,
        optionValue,
      );
    },

    getVariationProducts: async (
      productId: string,
      vectors: ProductAssignmentVector[],
      includeInactive = false,
    ) => {
      const product = await modules.products.findProduct({ productId });
      if (!product) throw new ProductNotFoundError({ productId });

      if (product.type !== 'CONFIGURABLE_PRODUCT') {
        throw new ProductWrongTypeError({
          productId,
          received: product.type,
          required: 'CONFIGURABLE_PRODUCT',
        });
      }

      return await modules.products.proxyProducts(product, vectors as any, {
        includeInactive,
      });
    },

    getProductAssignments: async (productId: string, includeInactive = false) => {
      const product = await getNormalizedProductDetails(productId, context);
      if (!product) throw new ProductNotFoundError({ productId });

      if (product.type !== ProductTypes.ConfigurableProduct) {
        throw new ProductWrongTypeError({
          productId,
          received: product.type,
          required: ProductTypes.ConfigurableProduct,
        });
      }

      return await modules.products.proxyAssignments(product, { includeInactive });
    },

    addAssignment: async (
      proxyId: string,
      assignProductId: string,
      vectors: ProductAssignmentVector[],
    ) => {
      const proxyProduct = await modules.products.findProduct({ productId: proxyId });
      if (!proxyProduct) throw new ProductNotFoundError({ productId: proxyId });

      if (proxyProduct.type !== ProductTypes.ConfigurableProduct) {
        throw new ProductWrongTypeError({
          productId: proxyId,
          received: proxyProduct.type,
          required: ProductTypes.ConfigurableProduct,
        });
      }

      const variations = await modules.products.variations.findProductVariations({ productId: proxyId });
      const variationMatrix = extractVariationMatrix(variations);
      const normalizedVectors = vectors?.reduce((prev, { key, value }) => {
        return { ...prev, [key]: value };
      }, {});

      if (!combinationExists(variationMatrix, normalizedVectors)) {
        throw new Error('Invalid variation vector combination');
      }

      const added = await modules.products.assignments.addProxyAssignment({
        productId: assignProductId,
        proxyId,
        vectors: vectors as any,
      });

      if (!added) throw new Error('Assignment already exists');

      return { productId: assignProductId, vectors };
    },

    removeAssignment: async (proxyId: string, vectors: ProductAssignmentVector[]) => {
      const product = await modules.products.findProduct({ productId: proxyId });
      if (!product) throw new ProductNotFoundError({ productId: proxyId });

      if (product.type !== ProductTypes.ConfigurableProduct) {
        throw new ProductWrongTypeError({
          productId: proxyId,
          received: product.type,
          required: ProductTypes.ConfigurableProduct,
        });
      }

      await modules.products.assignments.removeAssignment(proxyId, { vectors: vectors as any });
      return { removedVectors: vectors };
    },

    addBundleItem: async (bundleId: string, productId: string, quantity = 1) => {
      const product = await modules.products.findProduct({ productId: bundleId });
      if (!product) throw new ProductNotFoundError({ productId: bundleId });

      if (product.type !== ProductTypes.BundleProduct) {
        throw new ProductWrongTypeError({
          productId: bundleId,
          received: product.type,
          required: ProductTypes.BundleProduct,
        });
      }

      if (!(await modules.products.productExists({ productId }))) {
        throw new ProductNotFoundError({ productId });
      }

      await modules.products.bundleItems.addBundleItem(bundleId, {
        productId,
        quantity,
        configuration: [],
      });
      return await getNormalizedProductDetails(bundleId, context);
    },

    removeBundleItem: async (bundleId: string, index: number) => {
      const bundle = await modules.products.findProduct({ productId: bundleId });
      if (!bundle) throw new ProductNotFoundError({ productId: bundleId });

      if (bundle.type !== ProductTypes.BundleProduct) {
        throw new ProductWrongTypeError({
          productId: bundleId,
          received: bundle.type,
          required: ProductTypes.BundleProduct,
        });
      }

      await modules.products.bundleItems.removeBundleItem(bundleId, index);
      return await getNormalizedProductDetails(bundleId, context);
    },

    getBundleItems: async (bundleId: string) => {
      const product = await getNormalizedProductDetails(bundleId, context);
      if (!product) throw new ProductNotFoundError({ productId: bundleId });

      if (product.type !== ProductTypes.BundleProduct) {
        throw new ProductWrongTypeError({
          productId: bundleId,
          received: product.type,
          required: ProductTypes.BundleProduct,
        });
      }

      return product.bundleItems || [];
    },

    getCatalogPrice: async (productId: string, quantity = 1, currencyCode?: string) => {
      const product = await getNormalizedProductDetails(productId, context);
      if (!product) throw new ProductNotFoundError({ productId });

      const currency = currencyCode || context.currencyCode;

      const pricingContext = {
        product,
        user: context.user,
        countryCode: context.countryCode,
        currencyCode: currency,
        quantity,
      };

      const pricing = await context.services.products.simulateProductPricing(pricingContext as any);
      const unitPrice = pricing.unitPrice();

      return {
        ...unitPrice,
        isTaxable: pricing.taxSum() > 0,
        currencyCode: pricing.currencyCode,
      };
    },

    simulatePrice: async (
      productId: string,
      vectors: ProductAssignmentVector[],
      quantity = 1,
      currencyCode?: string,
      useNetPrice = false,
    ) => {
      const product = await getNormalizedProductDetails(productId, context);
      if (!product) throw new ProductNotFoundError({ productId });

      const currency = currencyCode || context.currencyCode;
      const pricingContext = {
        product,
        user: context.user,
        countryCode: context.countryCode,
        currencyCode: currency,
        quantity,
        configuration: vectors,
      };

      const pricing = await context.services.products.simulateProductPricing(pricingContext as any);
      const unitPrice = pricing.unitPrice({ useNetPrice });

      return {
        ...unitPrice,
        isNetPrice: useNetPrice,
        isTaxable: pricing.taxSum() > 0,
        currencyCode: pricing.currencyCode,
      };
    },

    simulatePriceRange: async (
      productId: string,
      vectors?: ProductAssignmentVector[],
      quantity = 1,
      currencyCode?: string,
      useNetPrice = false,
    ) => {
      const product = await getNormalizedProductDetails(productId, context);
      if (!product) throw new ProductNotFoundError({ productId });

      if (product.type !== ProductTypes.ConfigurableProduct) {
        throw new ProductWrongTypeError({
          productId,
          received: product.type,
          required: ProductTypes.ConfigurableProduct,
        });
      }

      const currency = currencyCode || context.currencyCode;
      const pricingContext = {
        product,
        user: context.user,
        countryCode: context.countryCode,
        currencyCode: currency,
        quantity,
        configuration: vectors,
      };

      const pricing = await context.services.products.simulateProductPricing(pricingContext as any);
      const minPrice = pricing.unitPrice({ useNetPrice });
      const maxPrice = pricing.unitPrice({ useNetPrice });

      return {
        min: minPrice,
        max: maxPrice,
        isNetPrice: useNetPrice,
        currencyCode: pricing.currencyCode,
      };
    },

    getProductTexts: async (productId: string) => {
      const product = await modules.products.findProduct({ productId });
      if (!product) throw new ProductNotFoundError({ productId });

      return await modules.products.texts.findTexts({ productId });
    },

    getVariationTexts: async (productVariationId: string, optionValue?: string) => {
      const variation = await modules.products.variations.findProductVariation({ productVariationId });
      if (!variation) throw new ProductVariationNotFoundError({ productVariationId });

      return await modules.products.variations.texts.findVariationTexts({
        productVariationId,
        productVariationOptionValue: optionValue,
      });
    },

    getMediaTexts: async (productMediaId: string) => {
      const media = await modules.products.media.findProductMedia({ productMediaId });
      if (!media) throw new ProductMediaNotFoundError({ productMediaId });

      return await modules.products.media.texts.findMediaTexts({ productMediaId });
    },

    getReviews: async (productId: string, options: ProductReviewsOptions = {}) => {
      const product = await modules.products.findProduct({ productId });
      if (!product) throw new ProductNotFoundError({ productId });

      const { limit = 50, offset = 0, queryString, sort } = options;

      const sortOptions = sort?.map((s) => ({ key: s.key, value: s.value as any })) || undefined;

      return await modules.products.reviews.findProductReviews({
        productId,
        limit,
        offset,
        queryString,
        sort: sortOptions,
      });
    },

    countReviews: async (productId: string, queryString?: string) => {
      const product = await modules.products.findProduct({ productId });
      if (!product) throw new ProductNotFoundError({ productId });

      return await modules.products.reviews.count({
        productId,
        queryString,
      });
    },

    getSiblings: async (productId: string, assortmentId?: string, includeInactive = false) => {
      const product = await modules.products.findProduct({ productId });
      if (!product) throw new ProductNotFoundError({ productId });

      const siblings = await modules.products.proxyProducts(product, [], {
        includeInactive,
      });
      return siblings;
    },

    getOperationName: (operation: ProductOperationType) => {
      const operationNames = {
        CREATE: 'create',
        UPDATE: 'update',
        REMOVE: 'remove',
        GET: 'get',
        LIST: 'list',
        COUNT: 'count',
        UPDATE_STATUS: 'updateStatus',
        ADD_MEDIA: 'addMedia',
        REMOVE_MEDIA: 'removeMedia',
        REORDER_MEDIA: 'reorderMedia',
        GET_MEDIA: 'getMedia',
        CREATE_VARIATION: 'createVariation',
        REMOVE_VARIATION: 'removeVariation',
        ADD_VARIATION_OPTION: 'addVariationOption',
        REMOVE_VARIATION_OPTION: 'removeVariationOption',
        ADD_ASSIGNMENT: 'addAssignment',
        REMOVE_ASSIGNMENT: 'removeAssignment',
        GET_ASSIGNMENTS: 'getProductAssignments',
        GET_VARIATION_PRODUCTS: 'getVariationProducts',
        ADD_BUNDLE_ITEM: 'addBundleItem',
        REMOVE_BUNDLE_ITEM: 'removeBundleItem',
        GET_BUNDLE_ITEMS: 'getBundleItems',
        SIMULATE_PRICE: 'simulatePrice',
        SIMULATE_PRICE_RANGE: 'simulatePriceRange',
        GET_CATALOG_PRICE: 'getCatalogPrice',
        GET_PRODUCT_TEXTS: 'getProductTexts',
        GET_MEDIA_TEXTS: 'getMediaTexts',
        GET_VARIATION_TEXTS: 'getVariationTexts',
        UPDATE_MEDIA_TEXTS: 'updateMediaTexts',
        UPDATE_VARIATION_TEXTS: 'updateVariationTexts',
        GET_REVIEWS: 'getReviews',
        COUNT_REVIEWS: 'countReviews',
        GET_SIBLINGS: 'getSiblings',
      };
      return operationNames[operation];
    },
  };
};

export type ProductMcpModule = ReturnType<typeof configureProductMcpModule>;
