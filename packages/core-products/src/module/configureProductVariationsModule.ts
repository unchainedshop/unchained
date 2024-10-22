import { ModuleInput } from '@unchainedshop/mongodb';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  findLocalizedText,
  generateDbFilterById,
  generateDbObjectId,
  mongodb,
} from '@unchainedshop/mongodb';
import { ProductVariationsCollection } from '../db/ProductVariationsCollection.js';
import { ProductVariation, ProductVariationText, ProductVariationType } from '../types.js';

export type ProductVariationsModule = {
  // Queries
  findProductVariationByKey: (query: { productId: string; key: string }) => Promise<ProductVariation>;
  findProductVariation: (query: { productVariationId: string }) => Promise<ProductVariation>;

  findProductVariations: (query: {
    productId: string;
    limit?: number;
    offset?: number;
    tags?: Array<string>;
  }) => Promise<Array<ProductVariation>>;

  // Transformations
  option: (
    productVariation: ProductVariation,
    productVariationOptionValue: string,
  ) => {
    _id: string;
    productVariationOption: string;
  };

  // Mutations
  create: (doc: ProductVariation & { locale?: string; title?: string }) => Promise<ProductVariation>;

  delete: (productVariationId: string) => Promise<number>;
  deleteVariations: (params: {
    productId?: string;
    excludedProductIds?: Array<string>;
  }) => Promise<number>;

  update: (productMediaId: string, doc: ProductVariation) => Promise<ProductVariation>;

  addVariationOption: (productVariationId: string, data: { value: string }) => Promise<ProductVariation>;

  removeVariationOption: (
    productVariationId: string,
    productVariationOptionValue: string,
  ) => Promise<void>;

  texts: {
    // Queries
    findVariationTexts: (query: {
      productVariationId: string;
      productVariationOptionValue?: string;
    }) => Promise<Array<ProductVariationText>>;

    findLocalizedVariationText: (query: {
      locale: string;
      productVariationId: string;
      productVariationOptionValue?: string;
    }) => Promise<ProductVariationText>;

    // Mutations
    updateVariationTexts: (
      productVariationId: string,
      texts: Array<Omit<ProductVariationText, 'productVariationId' | 'productVariationOptionValue'>>,
      productVariationOptionValue?: string,
    ) => Promise<Array<ProductVariationText>>;
  };
};

const PRODUCT_VARIATION_EVENTS = [
  'PRODUCT_CREATE_VARIATION',
  'PRODUCT_REMOVE_VARIATION',
  'PRODUCT_UPDATE_VARIATION_TEXT',
  'PRODUCT_VARIATION_OPTION_CREATE',
  'PRODUCT_REMOVE_VARIATION_OPTION',
];

export const configureProductVariationsModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<ProductVariationsModule> => {
  registerEvents(PRODUCT_VARIATION_EVENTS);

  const { ProductVariations, ProductVariationTexts } = await ProductVariationsCollection(db);

  const upsertLocalizedText = async (
    {
      productVariationId,
      productVariationOptionValue = null,
    }: {
      productVariationId: string;
      productVariationOptionValue?: string;
    },
    locale: string,
    text: Omit<ProductVariationText, 'locale' | 'productVariationId' | 'productVariationOptionValue'>,
  ): Promise<ProductVariationText> => {
    const selector = {
      productVariationId,
      productVariationOptionValue: productVariationOptionValue || {
        $eq: null,
      },
      locale,
    };

    const updateResult = await ProductVariationTexts.updateOne(
      selector,
      {
        $set: {
          ...text,
        },
        $setOnInsert: {
          _id: generateDbObjectId(),
          productVariationId,
          productVariationOptionValue: productVariationOptionValue || null,
          created: new Date(),
          locale,
        },
      },
      {
        upsert: true,
      },
    );
    const isModified = updateResult.upsertedCount > 0 || updateResult.modifiedCount > 0;

    const currentText = await ProductVariationTexts.findOne(selector, {});
    if (isModified) {
      await ProductVariationTexts.updateOne(selector, {
        $set: {
          updated: new Date(),
        },
      });
      await emit('PRODUCT_UPDATE_VARIATION_TEXT', {
        productVariationId,
        productVariationOptionValue,
        text: currentText,
      });
    }
    return currentText;
  };

  return {
    // Queries
    findProductVariationByKey: async ({ productId, key }) => {
      const selector: mongodb.Filter<ProductVariation> = {
        productId,
        key,
      };
      return ProductVariations.findOne(selector, {});
    },

    findProductVariation: async ({ productVariationId }) => {
      return ProductVariations.findOne(generateDbFilterById(productVariationId), {});
    },

    findProductVariations: async ({ productId, tags, offset, limit }) => {
      const selector: mongodb.Filter<ProductVariation> = { productId };
      if (tags && tags.length > 0) {
        selector.tags = { $all: tags };
      }

      const variations = ProductVariations.find(selector, {
        skip: offset,
        limit,
      });

      return variations.toArray();
    },

    // Transformations

    option: (productVariation, productVariationOption) => {
      return {
        _id: productVariation._id,
        productVariationOption,
      };
    },

    // Mutations
    create: async ({ type, ...doc }: ProductVariation & { title: string; locale: string }) => {
      const { insertedId: productVariationId } = await ProductVariations.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        type: ProductVariationType[type],
        ...doc,
      });

      const productVariation = await ProductVariations.findOne(
        generateDbFilterById(productVariationId),
        {},
      );

      await emit('PRODUCT_CREATE_VARIATION', {
        productVariation,
      });

      return productVariation;
    },

    delete: async (productVariationId) => {
      const selector = generateDbFilterById(productVariationId);

      await ProductVariationTexts.deleteMany({ productVariationId });

      const deletedResult = await ProductVariations.deleteOne(selector);

      await emit('PRODUCT_REMOVE_VARIATION', {
        productVariationId,
      });

      return deletedResult.deletedCount;
    },

    deleteVariations: async ({ productId, excludedProductIds }) => {
      const selector: mongodb.Filter<ProductVariation> = {};
      if (productId) {
        selector.productId = productId;
      } else if (excludedProductIds) {
        selector.productId = { $nin: excludedProductIds };
      }

      const ids = await ProductVariations.find(selector, { projection: { _id: true } })
        .map((m) => m._id)
        .toArray();
      await ProductVariationTexts.deleteMany({ productVariationId: { $in: ids } });

      const deletedResult = await ProductVariations.deleteMany(selector);
      return deletedResult.deletedCount;
    },

    // This action is specifically used for the bulk migration scripts in the platform package
    update: async (productVariationId, doc) => {
      const selector = generateDbFilterById(productVariationId);
      const modifier = { $set: doc };
      return ProductVariations.findOneAndUpdate(selector, modifier, {
        returnDocument: 'after',
      });
    },

    addVariationOption: async (productVariationId, { value }) => {
      const productVariation = await ProductVariations.findOneAndUpdate(
        generateDbFilterById(productVariationId),
        {
          $set: {
            updated: new Date(),
          },
          $addToSet: {
            options: value,
          },
        },
        { returnDocument: 'after' },
      );
      await emit('PRODUCT_VARIATION_OPTION_CREATE', { productVariation, value });

      return productVariation;
    },

    removeVariationOption: async (productVariationId, productVariationOptionValue) => {
      await ProductVariations.updateOne(generateDbFilterById(productVariationId), {
        $set: {
          updated: new Date(),
        },
        $pull: {
          options: productVariationOptionValue,
        },
      });

      await emit('PRODUCT_REMOVE_VARIATION_OPTION', {
        productVariationId,
        productVariationOptionValue,
      });
    },

    /*
     * Product Variation Texts
     */

    texts: {
      // Queries
      findVariationTexts: async ({ productVariationId, productVariationOptionValue }) => {
        return ProductVariationTexts.find({
          productVariationId,
          productVariationOptionValue,
        }).toArray();
      },

      findLocalizedVariationText: async ({
        productVariationId,
        productVariationOptionValue,
        locale,
      }) => {
        const parsedLocale = new Intl.Locale(locale);

        const selector: mongodb.Filter<ProductVariationText> = { productVariationId };
        selector.productVariationOptionValue = productVariationOptionValue ?? { $eq: null };
        const text = await findLocalizedText<ProductVariationText>(
          ProductVariationTexts,
          selector,
          parsedLocale,
        );

        return text;
      },

      // Mutations
      updateVariationTexts: async (productVariationId, texts, productVariationOptionValue) => {
        const productVariationTexts = await Promise.all(
          texts.map(async ({ locale, ...text }) =>
            upsertLocalizedText(
              {
                productVariationId,
                productVariationOptionValue,
              },
              locale,
              text,
            ),
          ),
        );

        return productVariationTexts;
      },
    },
  };
};
