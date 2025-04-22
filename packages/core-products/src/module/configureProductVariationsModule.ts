import { ModuleInput } from '@unchainedshop/mongodb';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  findLocalizedText,
  generateDbFilterById,
  generateDbObjectId,
  mongodb,
} from '@unchainedshop/mongodb';
import {
  ProductVariation,
  ProductVariationsCollection,
  ProductVariationText,
  ProductVariationType,
} from '../db/ProductVariationsCollection.js';

const PRODUCT_VARIATION_EVENTS = [
  'PRODUCT_CREATE_VARIATION',
  'PRODUCT_REMOVE_VARIATION',
  'PRODUCT_UPDATE_VARIATION_TEXT',
  'PRODUCT_VARIATION_OPTION_CREATE',
  'PRODUCT_REMOVE_VARIATION_OPTION',
];

export const configureProductVariationsModule = async ({ db }: ModuleInput<Record<string, never>>) => {
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
    findProductVariationByKey: async ({
      productId,
      key,
    }: {
      productId: string;
      key: string;
    }): Promise<ProductVariation> => {
      const selector: mongodb.Filter<ProductVariation> = {
        productId,
        key,
      };
      return ProductVariations.findOne(selector, {});
    },

    findProductVariation: async ({
      productVariationId,
    }: {
      productVariationId: string;
    }): Promise<ProductVariation> => {
      return ProductVariations.findOne(generateDbFilterById(productVariationId), {});
    },

    findProductVariations: async ({
      productId,
      tags,
      offset,
      limit,
    }: {
      productId: string;
      limit?: number;
      offset?: number;
      tags?: Array<string>;
    }): Promise<Array<ProductVariation>> => {
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

    create: async ({
      type,
      ...doc
    }: ProductVariation & { locale?: string; title?: string }): Promise<ProductVariation> => {
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

    delete: async (productVariationId: string) => {
      const selector = generateDbFilterById(productVariationId);

      await ProductVariationTexts.deleteMany({ productVariationId });

      const deletedResult = await ProductVariations.deleteOne(selector);

      await emit('PRODUCT_REMOVE_VARIATION', {
        productVariationId,
      });

      return deletedResult.deletedCount;
    },

    deleteVariations: async ({
      productId,
      excludedProductIds,
    }: {
      productId?: string;
      excludedProductIds?: Array<string>;
    }) => {
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
    update: async (productVariationId: string, doc: ProductVariation): Promise<ProductVariation> => {
      const selector = generateDbFilterById(productVariationId);
      const modifier = { $set: doc };
      return ProductVariations.findOneAndUpdate(selector, modifier, {
        returnDocument: 'after',
      });
    },

    addVariationOption: async (
      productVariationId,
      { value }: { value: string },
    ): Promise<ProductVariation> => {
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

    removeVariationOption: async (productVariationId: string, productVariationOptionValue: string) => {
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
      findVariationTexts: async ({
        productVariationId,
        productVariationOptionValue,
      }: {
        productVariationId: string;
        productVariationOptionValue?: string;
      }): Promise<Array<ProductVariationText>> => {
        return ProductVariationTexts.find({
          productVariationId,
          productVariationOptionValue,
        }).toArray();
      },

      findLocalizedVariationText: async ({
        productVariationId,
        productVariationOptionValue,
        locale,
      }: {
        locale: Intl.Locale;
        productVariationId: string;
        productVariationOptionValue?: string;
      }): Promise<ProductVariationText> => {
        const selector: mongodb.Filter<ProductVariationText> = { productVariationId };
        selector.productVariationOptionValue = productVariationOptionValue ?? { $eq: null };
        const text = await findLocalizedText<ProductVariationText>(
          ProductVariationTexts,
          selector,
          locale,
        );

        return text;
      },

      // Mutations
      updateVariationTexts: async (
        productVariationId: string,
        texts: Array<Omit<ProductVariationText, 'productVariationId' | 'productVariationOptionValue'>>,
        productVariationOptionValue?: string,
      ): Promise<Array<ProductVariationText>> => {
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
