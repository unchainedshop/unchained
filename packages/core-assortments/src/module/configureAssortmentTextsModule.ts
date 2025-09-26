import { emit, registerEvents } from '@unchainedshop/events';
import { findLocalizedText, generateDbObjectId, mongodb } from '@unchainedshop/mongodb';
import { findUnusedSlug } from '@unchainedshop/utils';
import { assortmentsSettings } from '../assortments-settings.js';
import { Assortment, AssortmentText } from '../db/AssortmentsCollection.js';

const ASSORTMENT_TEXT_EVENTS = ['ASSORTMENT_UPDATE_TEXT'];

export const configureAssortmentTextsModule = ({
  Assortments,
  AssortmentTexts,
}: {
  Assortments: mongodb.Collection<Assortment>;
  AssortmentTexts: mongodb.Collection<AssortmentText>;
}) => {
  registerEvents(ASSORTMENT_TEXT_EVENTS);

  const makeSlug = async ({
    slug,
    title,
    assortmentId,
  }: {
    slug?: string;
    title?: string;
    assortmentId: string;
  }): Promise<string> => {
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
    locale: Intl.Locale,
    text: Omit<AssortmentText, 'assortmentId' | 'locale'>,
  ) => {
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
        locale: locale.baseName,
      },
    };

    if (text.slug) {
      modifier.$set.slug = slug;
    } else {
      modifier.$setOnInsert.slug = slug;
    }

    const updateResult = await AssortmentTexts.findOneAndUpdate(
      { assortmentId, locale: locale.baseName },
      modifier,
      {
        upsert: true,
        returnDocument: 'after',
        includeResultMetadata: true,
      },
    );

    if (updateResult.ok) {
      await Assortments.updateOne(
        { _id: assortmentId },
        {
          $set: {
            updated: new Date(),
          },
          $addToSet: {
            slugs: slug,
          },
        },
      );

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
    findTexts: async (
      query: mongodb.Filter<AssortmentText>,
      options?: mongodb.FindOptions<AssortmentText>,
    ): Promise<AssortmentText[]> => {
      const texts = AssortmentTexts.find(query, options);

      return texts.toArray();
    },

    findLocalizedText: async ({
      assortmentId,
      locale,
    }: {
      assortmentId: string;
      locale: Intl.Locale;
    }): Promise<AssortmentText> => {
      const text = await findLocalizedText<AssortmentText>(AssortmentTexts, { assortmentId }, locale);
      return text;
    },

    // Mutations
    updateTexts: async (
      assortmentId: string,
      texts: Omit<AssortmentText, 'assortmentId'>[],
    ): Promise<AssortmentText[]> => {
      const assortmentTexts = (
        await Promise.all(
          texts.map(async ({ locale, ...text }) =>
            upsertLocalizedText(assortmentId, new Intl.Locale(locale), text),
          ),
        )
      ).filter(Boolean) as AssortmentText[];
      return assortmentTexts;
    },

    makeSlug,

    deleteMany: async ({
      assortmentId,
      excludedAssortmentIds,
    }: {
      assortmentId?: string;
      excludedAssortmentIds?: string[];
    }): Promise<number> => {
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

export type AssortmentTextsModule = ReturnType<typeof configureAssortmentTextsModule>;
