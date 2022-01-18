import { Collection } from '@unchainedshop/types/common';
import {
  Product,
  ProductsModule,
  ProductText,
} from '@unchainedshop/types/products';
import { Locale } from 'locale';
import { emit, registerEvents } from 'meteor/unchained:events';
import {
  findLocalizedText,
  findUnusedSlug,
  generateDbFilterById,
  generateDbObjectId,
} from 'meteor/unchained:utils';

const PRODUCT_TEXT_EVENTS = ['PRODUCT_UPDATE_TEXTS'];

export const configureProductTextsModule = ({
  Products,
  ProductTexts,
}: {
  Products: Collection<Product>;
  ProductTexts: Collection<ProductText>;
}): ProductsModule['texts'] => {
  registerEvents(PRODUCT_TEXT_EVENTS);

  const makeSlug = async ({ slug, title, productId }) => {
    const checkSlugIsUnique = async (newPotentialSlug: string) => {
      return (
        (await ProductTexts.find({
          productId: { $ne: productId },
          slug: newPotentialSlug,
        }).count()) === 0
      );
    };

    const findSlug = findUnusedSlug(checkSlugIsUnique, {});
    return await findSlug({
      existingSlug: slug,
      title: title || productId,
    });
  };

  const upsertLocalizedText = async (
    productId: string,
    locale: string,
    text: ProductText,
    userId?: string
  ) => {
    const {
      slug: textSlug,
      title = null,
      locale: textLocale,
      productId: textProductId,
      ...textFields
    } = text;
    const slug = await makeSlug({
      slug: textSlug,
      title,
      productId,
    });

    const modifier: any = {
      $set: {
        updated: new Date(),
        updatedBy: userId,
        title: text.title,
        ...textFields,
      },
      $setOnInsert: {
        _id: generateDbObjectId(),
        created: new Date(),
        createdBy: userId,
        productId,
        locale,
      },
    };

    if (text.slug) {
      modifier.$set.slug = slug;
    } else {
      modifier.$setOnInsert.slug = slug;
    }

    const selector = { productId, locale };

    const updateResult = await ProductTexts.updateOne(selector, modifier, {
      upsert: true,
    });

    if (updateResult.upsertedCount > 0 || updateResult.modifiedCount > 0) {
      await Products.updateOne(generateDbFilterById(productId), {
        $set: {
          updated: new Date(),
          updatedBy: userId,
        },
        $addToSet: {
          slugs: slug,
        },
      });

      await Products.updateMany(
        {
          _id: { $ne: productId },
          slugs: slug,
        },
        {
          $set: {
            updated: new Date(),
            updatedBy: userId,
          },
          $pull: {
            slugs: slug,
          },
        }
      );
    }

    return await ProductTexts.findOne(selector);
  };

  return {
    // Queries
    findTexts: async (selector, options) => {
      const texts = ProductTexts.find(selector, options);

      return await texts.toArray();
    },

    findLocalizedText: async ({ productId, locale }) => {
      const parsedLocale = new Locale(locale);

      const text = await findLocalizedText<ProductText>(
        ProductTexts,
        { productId },
        parsedLocale
      );

      return text;
    },

    searchTexts: async ({ searchText }) => {
      const productIds = ProductTexts.find(
        { $text: { $search: searchText } },
        {
          projection: {
            productId: 1,
          },
        }
      ).map(({ productId }) => productId);

      return await productIds.toArray();
    },

    // Mutations
    updateTexts: async (productId, texts, userId) => {
      const productTexts = texts
        ? await Promise.all(
            texts.map((text) =>
              upsertLocalizedText(
                productId,
                text.locale,
                {
                  ...text,
                  authorId: userId,
                },
                userId
              )
            )
          )
        : [];

      emit('PRODUCT_UPDATE_TEXTS', {
        productId,
        productTexts,
      });

      return productTexts;
    },

    upsertLocalizedText,
    makeSlug,

    deleteMany: async (productId) => {
      const deletedResult = await ProductTexts.deleteMany({ productId });

      return deletedResult.deletedCount;
    },
  };
};
