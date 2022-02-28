import { ProductMedia, ProductMediaModule, ProductMediaText } from '@unchainedshop/types/products.media';
import { ModuleInput, ModuleMutations, Query } from '@unchainedshop/types/common';
import { Locale } from 'locale';
import { emit, registerEvents } from 'meteor/unchained:events';
import {
  findLocalizedText,
  generateDbFilterById,
  generateDbMutations,
  generateDbObjectId,
} from 'meteor/unchained:utils';
import { FileDirector } from 'meteor/unchained:file-upload';
import { ProductMediaCollection } from '../db/ProductMediaCollection';
import { ProductMediaSchema } from '../db/ProductMediaSchema';

const PRODUCT_MEDIA_EVENTS = [
  'PRODUCT_ADD_MEDIA',
  'PRODUCT_REMOVE_MEDIA',
  'PRODUCT_REORDER_MEDIA',
  'PRODUCT_UPDATE_MEDIA_TEXT',
];

FileDirector.registerFileUploadCallback('product-media', async (file, { modules, userId }) => {
  await modules.products.media.create(
    {
      productId: file.meta.productId,
      mediaId: file._id,
    },
    userId || file.updatedBy || file.createdBy,
  );
});

export const configureProductMediaModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<ProductMediaModule> => {
  registerEvents(PRODUCT_MEDIA_EVENTS);

  const { ProductMedias, ProductMediaTexts } = await ProductMediaCollection(db);

  const mutations = generateDbMutations<ProductMedia>(
    ProductMedias,
    ProductMediaSchema,
  ) as ModuleMutations<ProductMedia>;

  const upsertLocalizedText = async (
    productMediaId: string,
    locale: string,
    text: ProductMediaText,
    userId: string,
  ) => {
    await ProductMediaTexts.updateOne(
      {
        productMediaId,
        locale,
      },
      {
        $set: {
          updated: new Date(),
          updatedBy: userId,
          ...text,
        },
        $setOnInsert: {
          _id: generateDbObjectId(),
          productMediaId,
          created: new Date(),
          createdBy: userId,
          locale,
        },
      },
      {
        upsert: true,
      },
    );

    return ProductMediaTexts.findOne({
      productMediaId,
      locale,
    });
  };

  return {
    // Queries
    findProductMedia: async ({ productMediaId }) => {
      return ProductMedias.findOne(generateDbFilterById(productMediaId), {});
    },

    findProductMedias: async ({ productId, tags, offset, limit }, options) => {
      const selector: Query = productId ? { productId } : {};
      if (tags && tags.length > 0) {
        selector.tags = { $all: tags };
      }

      const mediaList = ProductMedias.find(selector, {
        skip: offset,
        limit,
        sort: { sortKey: 1 },
        ...options,
      });

      return mediaList.toArray();
    },

    // Mutations
    create: async (doc: ProductMedia, userId) => {
      let { sortKey } = doc;

      if (!sortKey) {
        // Get next sort key
        const lastProductMedia = (await ProductMedias.findOne(
          {
            productId: doc.productId,
          },
          {
            sort: { sortKey: -1 },
          },
        )) || { sortKey: 0 };
        sortKey = lastProductMedia.sortKey + 1;
      }

      const productMediaId = await mutations.create(
        {
          tags: [],
          authorId: userId,
          ...doc,
          sortKey,
        },
        userId,
      );

      const productMedia = await ProductMedias.findOne(generateDbFilterById(productMediaId), {});

      emit('PRODUCT_ADD_MEDIA', {
        productMedia,
      });

      return productMedia;
    },

    delete: async (productMediaId) => {
      const selector = generateDbFilterById(productMediaId);

      const deletedResult = await ProductMedias.deleteOne(selector);

      emit('PRODUCT_REMOVE_MEDIA', {
        productMediaId,
      });

      return deletedResult.deletedCount;
    },

    deleteMediaFiles: async ({ productId, excludedProdcutIds, excludedProductMediaIds }) => {
      const selector: Query = productId ? { productId } : {};

      if (!productId && excludedProdcutIds) {
        selector.productId = { $nin: excludedProdcutIds };
      }

      if (excludedProductMediaIds) {
        selector._id = { $nin: excludedProductMediaIds };
      }

      const ids = await ProductMedias.find(selector, { projection: { _id: true } })
        .map((m) => m._id)
        .toArray();

      const deletedResult = await ProductMedias.deleteMany(selector);

      ids.forEach((assortmentMediaId) => {
        emit('PRODUCT_REMOVE_MEDIA', {
          assortmentMediaId,
        });
      });

      return deletedResult.deletedCount;
    },

    // This action is specifically used for the bulk migration scripts in the platform package
    update: async (productMediaId, doc) => {
      const selector = generateDbFilterById(productMediaId);
      const modifier = { $set: doc };
      await ProductMedias.updateOne(selector, modifier);
      return ProductMedias.findOne(selector, {});
    },

    updateManualOrder: async ({ sortKeys }, userId) => {
      const changedProductMediaIds = await Promise.all(
        sortKeys.map(async ({ productMediaId, sortKey }) => {
          await ProductMedias.updateOne(generateDbFilterById(productMediaId), {
            $set: {
              sortKey: sortKey + 1,
              updated: new Date(),
              updatedBy: userId,
            },
          });

          return productMediaId;
        }),
      );

      const productMedias = await ProductMedias.find({
        _id: { $in: changedProductMediaIds },
      }).toArray();

      emit('PRODUCT_REORDER_MEDIA', { productMedias });

      return productMedias;
    },

    /*
     * Product Media Texts
     */

    texts: {
      // Queries
      findMediaTexts: async ({ productMediaId }) => {
        return ProductMediaTexts.find({ productMediaId }).toArray();
      },

      findLocalizedMediaText: async ({ productMediaId, locale }) => {
        const parsedLocale = new Locale(locale);

        const text = await findLocalizedText<ProductMediaText>(
          ProductMediaTexts,
          { productMediaId },
          parsedLocale,
        );

        return text;
      },

      // Mutations
      updateMediaTexts: async (productMediaId, texts, userId) => {
        const mediaTexts = await Promise.all(
          texts.map(({ locale, ...localizations }) =>
            upsertLocalizedText(
              productMediaId,
              locale,
              {
                ...localizations,
                authorId: userId,
              },
              userId,
            ),
          ),
        );

        emit('PRODUCT_UPDATE_MEDIA_TEXT', {
          productMediaId,
          mediaTexts,
        });

        return mediaTexts;
      },

      upsertLocalizedText,
    },
  };
};
