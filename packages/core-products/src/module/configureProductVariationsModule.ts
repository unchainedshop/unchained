import {
  ProductVariation,
  ProductVariationsModule,
  ProductVariationText,
} from '@unchainedshop/types/products.variations';
import {
  ModuleInput,
  ModuleMutations,
  Query,
} from '@unchainedshop/types/common';
import { Locale } from 'locale';
import { emit, registerEvents } from 'meteor/unchained:events';
import {
  findLocalizedText,
  generateDbFilterById,
  generateDbMutations,
  dbIdToString,
} from 'meteor/unchained:utils';
import { ProductVariationsCollection } from '../db/ProductVariationsCollection';
import {
  ProductVariationsSchema,
  ProductVariationType,
} from '../db/ProductVariationsSchema';

const PRODUCT_VARIATION_EVENTS = [
  'PRODUCT_CREATE_VARIATION',
  'PRODUCT_REMOVE_VARIATION',
  'PRODUCT_UPDATE_VARIATION_TEXTS',
  'PRODUCT_VARIATION_OPTION_CREATE',
  'PRODUCT_REMOVE_VARIATION_OPTION',
];

export const configureProductVariationsModule = async ({
  db,
}: ModuleInput): Promise<ProductVariationsModule> => {
  registerEvents(PRODUCT_VARIATION_EVENTS);

  const { ProductVariations, ProductVariationTexts } =
    await ProductVariationsCollection(db);

  const mutations = generateDbMutations<ProductVariation>(
    ProductVariations,
    ProductVariationsSchema
  ) as ModuleMutations<ProductVariation>;

  const upsertLocalizedText = async (
    {
      productVariationId,
      productVariationOptionValue = null,
      locale,
      ...text
    }: ProductVariationText,
    userId: string
  ) => {
    const selector = {
      productVariationId,
      productVariationOptionValue: productVariationOptionValue || {
        $eq: null,
      },
      locale,
    };
    await ProductVariationTexts.updateOne(selector, {
      $set: {
        updated: new Date(),
        updatedBy: userId,
        ...text,
      },
      $setOnInsert: {
        productVariationId,
        productVariationOptionValue: productVariationOptionValue || null,
        created: new Date(),
        createdBy: userId,
        locale,
      },
    });

    return await ProductVariationTexts.findOne(selector);
  };

  return {
    // Queries
    findProductVariation: async ({ productVariationId }) => {
      return await ProductVariations.findOne(
        generateDbFilterById(productVariationId)
      );
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

      return await variations.toArray();
    },

    // Transformations

    option: (productVariation, productVariationOption) => {
      return {
        _id: dbIdToString(productVariation._id),
        productVariationOption,
      };
    },

    // Mutations
    create: async (
      {
        type,
        locale,
        title,
        authorId,
        ...doc
      }: ProductVariation & { title: string; locale: string },
      userId
    ) => {
      const productVariationId = await mutations.create(
        {
          type: ProductVariationType[type],
          authorId,
          ...doc,
        },
        userId
      );

      const productVariation = await ProductVariations.findOne(
        generateDbFilterById(productVariationId)
      );

      await upsertLocalizedText(
        {
          authorId,
          locale,
          productVariationId,
          title,
        },
        userId
      );

      emit('PRODUCT_CREATE_VARIATION', {
        productVariation,
      });

      return productVariation;
    },

    delete: async (productVariationId) => {
      const selector = generateDbFilterById(productVariationId);

      const deletedResult = await ProductVariations.deleteOne(selector);

      emit('PRODUCT_REMOVE_VARIATION', {
        productVariationId,
      });

      return deletedResult.deletedCount;
    },

    deleteVariations: async ({ productId, exlcudedProductVariationIds }) => {
      const selector: Query = {
        productId,
        _id: { $nin: exlcudedProductVariationIds },
      };
      const deletedResult = await ProductVariations.deleteMany(selector);
      return deletedResult.deletedCount;
    },

    // This action is specifically used for the bulk migration scripts in the platform package
    update: async (productVariationId, doc) => {
      const selector = generateDbFilterById(productVariationId);
      const modifier = { $set: doc };
      await ProductVariations.updateOne(selector, modifier);
      return await ProductVariations.findOne(selector);
    },

    addVariationOption: async (
      productVariationId,
      { inputData, localeContext },
      userId
    ) => {
      const { value, title } = inputData;

      await ProductVariations.updateOne(
        generateDbFilterById(productVariationId),
        {
          $set: {
            updated: new Date(),
            updatedBy: userId,
          },
          $addToSet: {
            options: value,
          },
        }
      );

      await upsertLocalizedText(
        {
          authorId: userId,
          locale: localeContext.language,
          productVariationId,
          productVariationOptionValue: value,
          title,
        },
        userId
      );

      const productVariation = await ProductVariations.findOne(
        generateDbFilterById(productVariationId)
      );

      emit('PRODUCT_VARIATION_OPTION_CREATE', { productVariation });

      return productVariation;
    },

    removeVariationOption: async (
      productVariationId,
      productVariationOptionValue,
      userId
    ) => {
      await ProductVariations.updateOne(
        generateDbFilterById(productVariationId),
        {
          $set: {
            updated: new Date(),
            updatedBy: userId,
          },
          $pull: {
            options: productVariationOptionValue,
          },
        }
      );

      emit('PRODUCT_REMOVE_VARIATION_OPTION', {
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
      }) => {
        return await ProductVariationTexts.find({
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

        const text = await findLocalizedText<ProductVariationText>(
          ProductVariationTexts,
          { productVariationId, productVariationOptionValue },
          parsedLocale
        );

        return text;
      },

      // Mutations
      updateVariationTexts: async (
        productVariationId,
        texts,
        productVariationOptionValue,
        userId
      ) => {
        const productVariationTexts = await Promise.all(
          texts.map(
            async ({ locale, ...text }) =>
              await upsertLocalizedText(
                {
                  ...text,
                  authorId: userId,
                  locale,
                  productVariationId,
                  productVariationOptionValue,
                },
                userId
              )
          )
        );

        emit('PRODUCT_UPDATE_VARIATION_TEXTS', {
          productVariationId,
          productVariationOptionValue,
          productVariationTexts,
        });

        return productVariationTexts;
      },

      upsertLocalizedText: async (
        { productVariationId, productVariationOptionValue },
        locale,
        text,
        userId
      ) =>
        await upsertLocalizedText(
          {
            productVariationId,
            productVariationOptionValue,
            locale,
            ...text,
          },
          userId
        ),
    },
  };
};
