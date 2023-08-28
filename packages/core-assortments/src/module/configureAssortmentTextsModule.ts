import { Assortment, AssortmentsModule, AssortmentText } from '@unchainedshop/types/assortments.js';
import { Collection, Filter } from '@unchainedshop/types/common.js';
import localePkg from 'locale';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  findLocalizedText,
  findUnusedSlug,
  generateDbFilterById,
  generateDbObjectId,
} from '@unchainedshop/utils';
import { assortmentsSettings } from '../assortments-settings.js';

const { Locale } = localePkg;

const ASSORTMENT_TEXT_EVENTS = ['ASSORTMENT_UPDATE_TEXTS'];

export const configureAssortmentTextsModule = ({
  Assortments,
  AssortmentTexts,
}: {
  Assortments: Collection<Assortment>;
  AssortmentTexts: Collection<AssortmentText>;
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

  const upsertLocalizedText: AssortmentsModule['texts']['upsertLocalizedText'] = async (
    assortmentId,
    locale,
    text,
  ) => {
    const { slug: textSlug, ...textFields } = text;
    const slug = await makeSlug({
      slug: textSlug,
      title: text.title,
      assortmentId,
    });

    const modifier: any = {
      $set: {
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

    const updateResult = await AssortmentTexts.updateOne(selector, modifier, {
      upsert: true,
    });
    const isModified = updateResult.upsertedCount > 0 || updateResult.modifiedCount > 0;

    if (isModified) {
      await AssortmentTexts.updateOne(selector, {
        $set: {
          updated: new Date(),
        },
      });
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
    }
    const currentText = await AssortmentTexts.findOne(selector, {});

    if (isModified)
      await emit('ASSORTMENT_UPDATE_TEXTS', {
        assortmentId,
        text: currentText,
      });

    return currentText;
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

    searchTexts: async ({ searchText }) => {
      const assortmentIds = AssortmentTexts.find(
        { $text: { $search: searchText } },
        {
          projection: {
            assortmentId: 1,
          },
        },
      ).map(({ assortmentId }) => assortmentId);

      return assortmentIds.toArray();
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

    upsertLocalizedText,
    makeSlug,

    deleteMany: async ({ assortmentId, excludedAssortmentIds }) => {
      const selector: Filter<AssortmentText> = {};
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
