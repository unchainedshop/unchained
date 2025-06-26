import { emit, registerEvents } from '@unchainedshop/events';
import { findUnusedSlug } from '@unchainedshop/utils';
import {
  mongodb,
  findLocalizedText,
  generateDbFilterById,
  generateDbObjectId,
} from '@unchainedshop/mongodb';
import { productsSettings } from '../products-settings.js';
import { Product, ProductText } from '../db/ProductsCollection.js';

const PRODUCT_TEXT_EVENTS = ['PRODUCT_UPDATE_TEXT'];

export const configureProductTextsModule = ({
  Products,
  ProductTexts,
}: {
  Products: mongodb.Collection<Product>;
  ProductTexts: mongodb.Collection<ProductText>;
}) => {
  registerEvents(PRODUCT_TEXT_EVENTS);

  const makeSlug = async ({
    slug,
    title,
    productId,
  }: {
    slug?: string;
    title: string;
    productId: string;
  }): Promise<string> => {
    const checkSlugIsUnique = async (newPotentialSlug: string) => {
      return (
        (await ProductTexts.countDocuments(
          {
            productId: { $ne: productId },
            slug: newPotentialSlug,
          },
          { limit: 1 },
        )) === 0
      );
    };

    const findSlug = findUnusedSlug(checkSlugIsUnique, { slugify: productsSettings.slugify });
    return findSlug({
      existingSlug: slug,
      title: title || productId,
    });
  };

  const upsertLocalizedText = async (
    productId: string,
    locale: Intl.Locale,
    text: Omit<ProductText, 'productId' | 'locale'>,
  ): Promise<ProductText> => {
    const { slug: textSlug, title = null, ...textFields } = text;
    const slug = await makeSlug({
      slug: textSlug,
      title,
      productId,
    });

    const modifier: any = {
      $set: {
        title: text.title,
        updated: new Date(),
        ...textFields,
      },
      $setOnInsert: {
        _id: generateDbObjectId(),
        created: new Date(),
        productId,
        locale: locale.baseName,
      },
    };

    if (text.slug) {
      modifier.$set.slug = slug;
    } else {
      modifier.$setOnInsert.slug = slug;
    }

    const updateResult = await ProductTexts.findOneAndUpdate(
      { productId, locale: locale.baseName },
      modifier,
      {
        upsert: true,
        returnDocument: 'after',
        includeResultMetadata: true,
      },
    );

    if (updateResult.ok) {
      await Products.updateOne(generateDbFilterById(productId), {
        $set: {
          updated: new Date(),
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
          },
          $pull: {
            slugs: slug,
          },
        },
      );
      await emit('PRODUCT_UPDATE_TEXT', {
        productId,
        text: updateResult.value,
      });
    }

    return updateResult.value;
  };

  return {
    // Queries
    findTexts: async (
      query: mongodb.Filter<ProductText>,
      options?: mongodb.FindOptions,
    ): Promise<ProductText[]> => {
      const texts = ProductTexts.find(query, options);

      return texts.toArray();
    },

    findLocalizedText: async ({
      productId,
      locale,
    }: {
      productId: string;
      locale: Intl.Locale;
    }): Promise<ProductText> => {
      const text = await findLocalizedText<ProductText>(ProductTexts, { productId }, locale);
      return text;
    },

    // Mutations
    updateTexts: async (
      productId: string,
      texts: Omit<ProductText, 'productId'>[],
    ): Promise<ProductText[]> => {
      const productTexts = await Promise.all(
        texts.map(async ({ locale, ...text }) =>
          upsertLocalizedText(productId, new Intl.Locale(locale), text),
        ),
      );
      return productTexts;
    },

    makeSlug,

    deleteMany: async ({
      productId,
      excludedProductIds,
    }: {
      productId?: string;
      excludedProductIds?: string[];
    }): Promise<number> => {
      const selector: mongodb.Filter<ProductText> = {};
      if (productId) {
        selector.productId = productId;
      } else if (excludedProductIds) {
        selector.productId = { $nin: excludedProductIds };
      }
      const deletedResult = await ProductTexts.deleteMany(selector);
      return deletedResult.deletedCount;
    },
  };
};
