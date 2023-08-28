import {
  ProductMedia,
  ProductMediaModule,
  ProductMediaText,
} from '@unchainedshop/types/products.media.js';
import { Query } from '@unchainedshop/types/common.js';
import { ModuleInput, ModuleMutations } from '@unchainedshop/types/core.js';
import localePkg from 'locale';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  findLocalizedText,
  generateDbFilterById,
  generateDbMutations,
  generateDbObjectId,
} from '@unchainedshop/utils';
import { FileDirector } from '@unchainedshop/file-upload';
import { ProductsModule } from '@unchainedshop/types/products.js';
import { ProductMediaCollection } from '../db/ProductMediaCollection.js';
import { ProductMediaSchema } from '../db/ProductMediaSchema.js';

const { Locale } = localePkg;

const PRODUCT_MEDIA_EVENTS = [
  'PRODUCT_ADD_MEDIA',
  'PRODUCT_REMOVE_MEDIA',
  'PRODUCT_REORDER_MEDIA',
  'PRODUCT_UPDATE_MEDIA_TEXT',
];

FileDirector.registerFileUploadCallback('product-media', async (file, { modules }) => {
  await modules.products.media.create({
    productId: file.meta?.productId as string,
    mediaId: file._id,
  });
});

export const configureProductMediaModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<ProductMediaModule> => {
  registerEvents(PRODUCT_MEDIA_EVENTS);

  const { ProductMedias, ProductMediaTexts } = await ProductMediaCollection(db);

  const mutations = generateDbMutations<ProductMedia>(ProductMedias, ProductMediaSchema, {
    permanentlyDeleteByDefault: true,
    hasCreateOnly: false,
  }) as ModuleMutations<ProductMedia>;

  const upsertLocalizedText: ProductsModule['media']['texts']['upsertLocalizedText'] = async (
    productMediaId,
    locale,
    text,
  ) => {
    const selector = {
      productMediaId,
      locale,
    };
    const updateResult = await ProductMediaTexts.updateOne(
      selector,
      {
        $set: {
          ...text,
        },
        $setOnInsert: {
          _id: generateDbObjectId(),
          productMediaId,
          created: new Date(),
          locale,
        },
      },
      {
        upsert: true,
      },
    );

    const currentText = await ProductMediaTexts.findOne({
      productMediaId,
      locale,
    });
    const isModified = updateResult.upsertedCount > 0 || updateResult.modifiedCount > 0;
    if (isModified) {
      await ProductMediaTexts.updateOne(selector, {
        $set: {
          updated: new Date(),
        },
      });
      await emit('PRODUCT_UPDATE_MEDIA_TEXT', {
        productMediaId,
        text: currentText,
      });
    }
    return currentText;
  };

  return {
    // Queries
    findProductMedia: async ({ productMediaId }) => {
      return ProductMedias.findOne(generateDbFilterById(productMediaId), {});
    },

    findProductMedias: async ({ productId, tags, offset, limit }, options) => {
      const selector: Query = productId ? { productId } : {};
      if (tags?.length > 0) {
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
    create: async (doc: ProductMedia) => {
      let { sortKey } = doc;

      if (sortKey === undefined || sortKey === null) {
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

      const productMediaId = await mutations.create({
        tags: [],
        ...doc,
        sortKey,
      });

      const productMedia = await ProductMedias.findOne(generateDbFilterById(productMediaId), {});

      await emit('PRODUCT_ADD_MEDIA', {
        productMedia,
      });

      return productMedia;
    },

    delete: async (productMediaId) => {
      const selector = generateDbFilterById(productMediaId);

      await ProductMediaTexts.deleteMany({ productMediaId });

      const deletedResult = await ProductMedias.deleteOne(selector);

      await emit('PRODUCT_REMOVE_MEDIA', {
        productMediaId,
      });

      return deletedResult.deletedCount;
    },

    deleteMediaFiles: async ({ productId, excludedProductIds, excludedProductMediaIds }) => {
      const selector: Query = productId ? { productId } : {};

      if (!productId && excludedProductIds) {
        selector.productId = { $nin: excludedProductIds };
      }

      if (excludedProductMediaIds) {
        selector._id = { $nin: excludedProductMediaIds };
      }

      const ids = await ProductMedias.find(selector, { projection: { _id: true } })
        .map((m) => m._id)
        .toArray();

      await ProductMediaTexts.deleteMany({ productMediaId: { $in: ids } });

      const deletedResult = await ProductMedias.deleteMany(selector);

      await Promise.all(
        ids.map(async (assortmentMediaId) =>
          emit('PRODUCT_REMOVE_MEDIA', {
            assortmentMediaId,
          }),
        ),
      );

      return deletedResult.deletedCount;
    },

    // This action is specifically used for the bulk migration scripts in the platform package
    update: async (productMediaId, doc) => {
      const selector = generateDbFilterById(productMediaId);
      const modifier = { $set: doc };
      await ProductMedias.updateOne(selector, modifier);
      return ProductMedias.findOne(selector, {});
    },

    updateManualOrder: async ({ sortKeys }) => {
      const changedProductMediaIds = await Promise.all(
        sortKeys.map(async ({ productMediaId, sortKey }) => {
          await ProductMedias.updateOne(generateDbFilterById(productMediaId), {
            $set: {
              sortKey: sortKey + 1,
              updated: new Date(),
            },
          });

          return productMediaId;
        }),
      );

      const productMedias = await ProductMedias.find({
        _id: { $in: changedProductMediaIds },
      }).toArray();

      await emit('PRODUCT_REORDER_MEDIA', { productMedias });

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
      updateMediaTexts: async (productMediaId, texts) => {
        const mediaTexts = await Promise.all(
          texts.map(({ locale, ...localizations }) =>
            upsertLocalizedText(productMediaId, locale, localizations),
          ),
        );

        return mediaTexts;
      },

      upsertLocalizedText,
    },
  };
};
