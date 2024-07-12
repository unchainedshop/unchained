import { Assortment, AssortmentsModule, AssortmentText } from '@unchainedshop/types/assortments.js';
import localePkg from 'locale';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  findLocalizedText,
  generateDbFilterById,
  generateDbObjectId,
  mongodb,
} from '@unchainedshop/mongodb';
import { findUnusedSlug } from '@unchainedshop/utils';
import { assortmentsSettings } from '../assortments-settings.js';

const { Locale } = localePkg;

const ASSORTMENT_TEXT_EVENTS = ['ASSORTMENT_UPDATE_TEXT'];

export const configureAssortmentTextsModule = ({
  Assortments,
  AssortmentTexts,
}: {
  Assortments: mongodb.Collection<Assortment>;
  AssortmentTexts: mongodb.Collection<AssortmentText>;
}): AssortmentsModule['texts'] => {
  registerEvents(ASSORTMENT_TEXT_EVENTS);

  const makeSlug = async ({ slug, title, assortmentId }) => {
    const checkSlugIsUnique = async (newPotentialSlug: string) => {
      return (
        (await AssortmentTexts.countDocuments(
          {
            assortmentId: { $ne: assortmentId },
            slug: newPotentialSlug,
          },
          { limit: 1 },
        )) === 0
      );
    };

    const findSlug = findUnusedSlug(checkSlugIsUnique, { slugify: assortmentsSettings.slugify });
    return findSlug({
      existingSlug: slug,
      title: title || assortmentId,
    });
  };

  const upsertLocalizedText = async (
    assortmentId: string,
    locale: string,
    text: Omit<AssortmentText, 'assortmentId' | 'locale'>,
  ): Promise<AssortmentText> => {
    const { slug: textSlug, ...textFields } = text;
    const slug = await makeSlug({
      slug: textSlug,
      title: text.title,
      assortmentId,
    });

    const modifier: any = {
      $set: {
        updated: new Date(),
        ...textFields,
      },
      $setOnInsert: {
        _id: generateDbObjectId(),
        created: new Date(),
        locale,
      },
    };

    if (text.slug) {
      modifier.$set.slug = slug;
    } else {
      modifier.$setOnInsert.slug = slug;
    }

    const selector = { assortmentId, locale };

    const updateResult = await AssortmentTexts.findOneAndUpdate(selector, modifier, {
      upsert: true,
      returnDocument: 'after',
      includeResultMetadata: true,
    });

    if (updateResult.ok) {
      const assortmentSelector = generateDbFilterById(assortmentId);
      await Assortments.updateOne(assortmentSelector, {
        $set: {
          updated: new Date(),
        },
        $addToSet: {
          slugs: slug,
        },
      });

      await Assortments.updateMany(
        {
          _id: { $ne: assortmentId },
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
      await emit('ASSORTMENT_UPDATE_TEXT', {
        assortmentId,
        text: updateResult.value,
      });
    }

    return updateResult.value;
  };

  return {
    // Queries
    findTexts: async (query, options) => {
      const texts = AssortmentTexts.find(query, options);

      return texts.toArray();
    },

    findLocalizedText: async ({ assortmentId, locale }) => {
      const parsedLocale = new Locale(locale);

      const text = await findLocalizedText<AssortmentText>(
        AssortmentTexts,
        { assortmentId },
        parsedLocale,
      );

      return text;
    },

    // Mutations
    updateTexts: async (assortmentId, texts) => {
      const assortmentTexts = Array.isArray(texts)
        ? await Promise.all(
            texts.map(async ({ locale, ...text }) => upsertLocalizedText(assortmentId, locale, text)),
          )
        : [];

      return assortmentTexts;
    },

    makeSlug,

    deleteMany: async ({ assortmentId, excludedAssortmentIds }) => {
      const selector: mongodb.Filter<AssortmentText> = {};
      if (assortmentId) {
        selector.assortmentId = assortmentId;
      } else if (excludedAssortmentIds) {
        selector.assortmentId = { $nin: excludedAssortmentIds };
      }
      const deletedResult = await AssortmentTexts.deleteMany(selector);

      return deletedResult.deletedCount;
    },
  };
};
