import {
  ProductVariation,
  ProductVariationsModule,
  ProductVariationText,
} from '@unchainedshop/types/products.variations.js';
import { Filter, Query } from '@unchainedshop/types/common.js';
import { ModuleInput, ModuleMutations } from '@unchainedshop/types/core.js';
import localePkg from 'locale';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  findLocalizedText,
  generateDbFilterById,
  generateDbMutations,
  generateDbObjectId,
} from '@unchainedshop/utils';
import { ProductVariationsCollection } from '../db/ProductVariationsCollection.js';
import { ProductVariationsSchema, ProductVariationType } from '../db/ProductVariationsSchema.js';

const { Locale } = localePkg;

const PRODUCT_VARIATION_EVENTS = [
  'PRODUCT_CREATE_VARIATION',
  'PRODUCT_REMOVE_VARIATION',
  'PRODUCT_UPDATE_VARIATION_TEXTS',
  'PRODUCT_VARIATION_OPTION_CREATE',
  'PRODUCT_REMOVE_VARIATION_OPTION',
];

export const configureProductVariationsModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<ProductVariationsModule> => {
  registerEvents(PRODUCT_VARIATION_EVENTS);

  const { ProductVariations, ProductVariationTexts } = await ProductVariationsCollection(db);

  const mutations = generateDbMutations<ProductVariation>(ProductVariations, ProductVariationsSchema, {
    permanentlyDeleteByDefault: true,
    hasCreateOnly: false,
  }) as ModuleMutations<ProductVariation>;

  const upsertLocalizedText = async (
    { productVariationId, productVariationOptionValue = null },
    locale,
    text,
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
      await emit('PRODUCT_UPDATE_VARIATION_TEXTS', {
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
      const selector: Query = {
        productId,
        key,
      };
      return ProductVariations.findOne(selector, {});
    },

    findProductVariation: async ({ productVariationId }) => {
      return ProductVariations.findOne(generateDbFilterById(productVariationId), {});
    },

    findProductVariations: async ({ productId, tags, offset, limit }) => {
      const selector: Query = { productId };
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
    create: async ({
      type,
      locale,
      title,
      ...doc
    }: ProductVariation & { title: string; locale: string }) => {
      const productVariationId = await mutations.create({
        type: ProductVariationType[type],
        ...doc,
      });

      const productVariation = await ProductVariations.findOne(
        generateDbFilterById(productVariationId),
        {},
      );

      await upsertLocalizedText(
        {
          productVariationId,
        },
        locale,
        { title },
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
      const selector: Filter<ProductVariation> = {};
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
      await ProductVariations.updateOne(selector, modifier);
      return ProductVariations.findOne(selector, {});
    },

    addVariationOption: async (productVariationId, { value, title, locale }) => {
      await ProductVariations.updateOne(generateDbFilterById(productVariationId), {
        $set: {
          updated: new Date(),
        },
        $addToSet: {
          options: value,
        },
      });

      await upsertLocalizedText(
        {
          productVariationId,
          productVariationOptionValue: value,
        },
        locale,
        { title },
      );

      const productVariation = await ProductVariations.findOne(
        generateDbFilterById(productVariationId),
        {},
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
        const parsedLocale = new Locale(locale);

        const selector: Query = { productVariationId };
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

      upsertLocalizedText,
    },
  };
};
