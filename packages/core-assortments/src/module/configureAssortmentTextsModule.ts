import { Assortment, AssortmentsModule, AssortmentText } from '@unchainedshop/types/assortments';
import { Collection } from '@unchainedshop/types/common';
import { Locale } from 'locale';
import { emit, registerEvents } from 'meteor/unchained:events';
import {
  findLocalizedText,
  findUnusedSlug,
  generateDbFilterById,
  generateDbObjectId,
} from 'meteor/unchained:utils';

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
        (await AssortmentTexts.find({
          assortmentId: { $ne: assortmentId },
          slug: newPotentialSlug,
        }).count()) === 0
      );
    };

    const findSlug = findUnusedSlug(checkSlugIsUnique, {});
    return findSlug({
      existingSlug: slug,
      title: title || assortmentId,
    });
  };

  const upsertLocalizedText = async (
    assortmentId: string,
    locale: string,
    text: AssortmentText,
    userId?: string,
  ) => {
    const { slug: textSlug, locale: textLocale, ...textFields } = text;
    const slug = await makeSlug({
      slug: textSlug,
      title: text.title,
      assortmentId,
    });

    const modifier: any = {
      $set: {
        updated: new Date(),
        updatedBy: userId,
        ...textFields,
      },
      $setOnInsert: {
        _id: generateDbObjectId(),
        created: new Date(),
        createdBy: userId,
        locale: locale || textLocale,
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

    if (updateResult.upsertedCount > 0 || updateResult.modifiedCount > 0) {
      const assortmentSelector = generateDbFilterById(assortmentId);
      await Assortments.updateOne(assortmentSelector, {
        $set: {
          updated: new Date(),
          updatedBy: userId,
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
            updatedBy: userId,
          },
          $pull: {
            slugs: slug,
          },
        },
      );
    }
    return AssortmentTexts.findOne(
      updateResult.upsertedId ? { _id: (updateResult.upsertedId as any)._id } : selector,
    );
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
    updateTexts: async (assortmentId, texts, userId) => {
      const assortmentTexts = Array.isArray(texts)
        ? await Promise.all(
            texts.map((text) =>
              upsertLocalizedText(
                assortmentId,
                text.locale,
                {
                  ...text,
                  authorId: userId,
                },
                userId,
              ),
            ),
          )
        : [];

      emit('ASSORTMENT_UPDATE_TEXTS', {
        assortmentId,
        assortmentTexts,
      });

      return assortmentTexts;
    },

    upsertLocalizedText,
    makeSlug,

    deleteMany: async (assortmentId) => {
      const deletedResult = await AssortmentTexts.deleteMany({ assortmentId });

      return deletedResult.deletedCount;
    },
  };
};
