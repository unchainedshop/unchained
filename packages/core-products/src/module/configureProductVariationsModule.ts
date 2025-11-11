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

export const configureProductVariationsModule = async ({ db }: ModuleInput<Record<string, unknown>>) => {
  registerEvents(PRODUCT_VARIATION_EVENTS);

  const { ProductVariations, ProductVariationTexts } = await ProductVariationsCollection(db);

  const upsertLocalizedText = async (
    {
      productVariationId,
      productVariationOptionValue,
    }: {
      productVariationId: string;
      productVariationOptionValue?: string;
    },
    locale: Intl.Locale,
    text: Omit<
      ProductVariationText,
      | '_id'
      | 'locale'
      | 'productVariationId'
      | 'productVariationOptionValue'
      | 'created'
      | 'updated'
      | 'deleted'
    >,
  ): Promise<ProductVariationText> => {
    const productVariationText = (await ProductVariationTexts.findOneAndUpdate(
      {
        productVariationId,
        productVariationOptionValue: productVariationOptionValue || {
          $eq: null,
        },
        locale: locale.baseName,
      },
      {
        $set: {
          ...text,
          updated: new Date(),
        },
        $setOnInsert: {
          _id: generateDbObjectId(),
          productVariationId,
          productVariationOptionValue: productVariationOptionValue || null,
          created: new Date(),
          locale: locale.baseName,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      },
    )) as ProductVariationText;

    await emit('PRODUCT_UPDATE_VARIATION_TEXT', {
      productVariationId,
      productVariationOptionValue,
      text: productVariationText,
    });
    return productVariationText;
  };

  return {
    // Queries
    findProductVariationByKey: async ({ productId, key }: { productId: string; key: string }) => {
      const selector: mongodb.Filter<ProductVariation> = {
        productId,
        key,
      };
      return ProductVariations.findOne(selector, {});
    },

    findProductVariation: async ({ productVariationId }: { productVariationId: string }) => {
      return ProductVariations.findOne(generateDbFilterById(productVariationId), {});
    },

    findProductVariations: async (
      query: mongodb.Filter<ProductVariation> & {
        productId?: string | mongodb.Filter<string>;
        tags?: string[];
        limit?: number;
        offset?: number;
      },
      options?: mongodb.FindOptions,
    ): Promise<ProductVariation[]> => {
      const { productId, tags, offset, limit, ...rest } = query;
      const selector: mongodb.Filter<ProductVariation> = { ...rest };

      if (productId) {
        selector.productId = productId as any;
      }
      if (tags && tags.length > 0) {
        selector.tags = { $all: tags };
      }

      const variations = ProductVariations.find(selector, {
        skip: offset,
        limit,
        ...options,
      });

      return variations.toArray();
    },

    create: async ({
      type,
      ...doc
    }: Omit<ProductVariation, '_id' | 'created'> &
      Pick<Partial<ProductVariation>, '_id' | 'created'> & {
        locale?: string;
        title?: string;
      }): Promise<ProductVariation> => {
      const { insertedId: productVariationId } = await ProductVariations.insertOne({
        _id: generateDbObjectId(),
        created: new Date(),
        type: ProductVariationType[type],
        ...doc,
      });

      const productVariation = (await ProductVariations.findOne(
        generateDbFilterById(productVariationId),
        {},
      )) as ProductVariation;

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
      excludedProductIds?: string[];
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
    update: async (productVariationId: string, doc: Partial<ProductVariation>) => {
      const selector = generateDbFilterById(productVariationId);
      const modifier = { $set: doc };
      return ProductVariations.findOneAndUpdate(selector, modifier, {
        returnDocument: 'after',
      });
    },

    addVariationOption: async (productVariationId, { value }: { value: string }) => {
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

      if (!productVariation) return null;
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
      findVariationTexts: async (
        query: mongodb.Filter<ProductVariationText>,
        options?: mongodb.FindOptions,
      ): Promise<ProductVariationText[]> => {
        return ProductVariationTexts.find(query, options).toArray();
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
        texts: Omit<
          ProductVariationText,
          | '_id'
          | 'productVariationId'
          | 'productVariationOptionValue'
          | 'created'
          | 'updated'
          | 'deleted'
        >[],
        productVariationOptionValue?: string,
      ): Promise<ProductVariationText[]> => {
        const productVariationTexts = await Promise.all(
          texts.map(async ({ locale, ...text }) =>
            upsertLocalizedText(
              {
                productVariationId,
                productVariationOptionValue,
              },
              new Intl.Locale(locale),
              text,
            ),
          ),
        );

        return productVariationTexts;
      },
    },
  };
};
