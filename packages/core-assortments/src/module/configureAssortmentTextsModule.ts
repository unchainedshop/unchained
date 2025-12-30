import { emit, registerEvents } from '@unchainedshop/events';
import { generateId, eq, and, inArray, notInArray, sql, type DrizzleDb } from '@unchainedshop/store';
import { findUnusedSlug } from '@unchainedshop/utils';
import { assortmentsSettings } from '../assortments-settings.ts';
import { assortments, assortmentTexts, type AssortmentText } from '../db/schema.ts';
import { searchAssortmentTextsFTS } from '../db/fts.ts';

const ASSORTMENT_TEXT_EVENTS = ['ASSORTMENT_UPDATE_TEXT'];

export const configureAssortmentTextsModule = ({ db }: { db: DrizzleDb }) => {
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
      const [existing] = await db
        .select({ _id: assortmentTexts._id })
        .from(assortmentTexts)
        .where(
          and(
            sql`${assortmentTexts.assortmentId} != ${assortmentId}`,
            eq(assortmentTexts.slug, newPotentialSlug),
          ),
        )
        .limit(1);
      return !existing;
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
    text: Omit<Partial<AssortmentText>, 'assortmentId' | 'locale'>,
  ) => {
    const { slug: textSlug, ...textFields } = text;
    const slug = await makeSlug({
      slug: textSlug ?? undefined,
      title: text.title ?? undefined,
      assortmentId,
    });

    const localeString = locale.baseName;
    const now = new Date();

    // Find existing
    const [existing] = await db
      .select()
      .from(assortmentTexts)
      .where(
        and(eq(assortmentTexts.assortmentId, assortmentId), eq(assortmentTexts.locale, localeString)),
      )
      .limit(1);

    let assortmentText: AssortmentText;

    if (existing) {
      // Update existing
      const updateData: Partial<AssortmentText> = {
        ...textFields,
        updated: now,
      };
      if (text.slug) {
        updateData.slug = slug;
      }

      await db.update(assortmentTexts).set(updateData).where(eq(assortmentTexts._id, existing._id));

      [assortmentText] = await db
        .select()
        .from(assortmentTexts)
        .where(eq(assortmentTexts._id, existing._id))
        .limit(1);
    } else {
      // Insert new
      const textId = generateId();
      await db.insert(assortmentTexts).values({
        _id: textId,
        assortmentId,
        locale: localeString,
        slug,
        created: now,
        ...textFields,
      });

      [assortmentText] = await db
        .select()
        .from(assortmentTexts)
        .where(eq(assortmentTexts._id, textId))
        .limit(1);
    }

    // Note: assortment_texts_fts is synced automatically via triggers from createFTS

    // Update the assortment's slugs array
    const [currentAssortment] = await db
      .select()
      .from(assortments)
      .where(eq(assortments._id, assortmentId))
      .limit(1);

    if (currentAssortment) {
      const currentSlugs = currentAssortment.slugs || [];
      if (!currentSlugs.includes(slug)) {
        await db
          .update(assortments)
          .set({
            slugs: [...currentSlugs, slug],
            updated: now,
          })
          .where(eq(assortments._id, assortmentId));

        // Update assortments FTS
        const newSlugs = [...currentSlugs, slug];
        const newSlugsText = newSlugs.join(' ');
        await db.run(sql`DELETE FROM assortments_fts WHERE _id = ${assortmentId}`);
        await db.run(
          sql`INSERT INTO assortments_fts(_id, slugs_text) VALUES (${assortmentId}, ${newSlugsText})`,
        );
      }
    }

    // Remove slug from other assortments
    const otherAssortmentsWithSlug = await db
      .select()
      .from(assortments)
      .where(
        and(
          sql`${assortments._id} != ${assortmentId}`,
          sql`EXISTS (SELECT 1 FROM json_each(${assortments.slugs}) WHERE value = ${slug})`,
        ),
      );

    for (const otherAssortment of otherAssortmentsWithSlug) {
      const filteredSlugs = (otherAssortment.slugs || []).filter((s) => s !== slug);
      await db
        .update(assortments)
        .set({
          slugs: filteredSlugs,
          updated: now,
        })
        .where(eq(assortments._id, otherAssortment._id));

      // Update FTS
      const filteredSlugsText = filteredSlugs.join(' ');
      await db.run(sql`DELETE FROM assortments_fts WHERE _id = ${otherAssortment._id}`);
      await db.run(
        sql`INSERT INTO assortments_fts(_id, slugs_text) VALUES (${otherAssortment._id}, ${filteredSlugsText})`,
      );
    }

    await emit('ASSORTMENT_UPDATE_TEXT', {
      assortmentId,
      text: assortmentText,
    });

    return assortmentText;
  };

  return {
    findTexts: async (
      query: { assortmentId?: string; assortmentIds?: string[]; queryString?: string },
      options?: {
        limit?: number;
        offset?: number;
        sort?: Record<string, number>;
        projection?: Record<string, number>;
      },
    ): Promise<AssortmentText[]> => {
      void options;
      const conditions: ReturnType<typeof eq>[] = [];

      if (query.assortmentId) {
        conditions.push(eq(assortmentTexts.assortmentId, query.assortmentId));
      }
      if (query.assortmentIds?.length) {
        conditions.push(inArray(assortmentTexts.assortmentId, query.assortmentIds));
      }

      if (query.queryString) {
        const matchingIds = await searchAssortmentTextsFTS(db, query.queryString);
        if (matchingIds.length === 0) {
          return [];
        }
        conditions.push(inArray(assortmentTexts._id, matchingIds));
      }

      if (conditions.length === 0) {
        return db.select().from(assortmentTexts);
      }

      return db
        .select()
        .from(assortmentTexts)
        .where(and(...conditions));
    },

    findLocalizedText: async ({
      assortmentId,
      locale,
    }: {
      assortmentId: string;
      locale: Intl.Locale;
    }): Promise<AssortmentText | null> => {
      const localeString = locale.baseName;
      const languageCode = locale.language;

      // Try exact locale match first
      let [text] = await db
        .select()
        .from(assortmentTexts)
        .where(
          and(eq(assortmentTexts.assortmentId, assortmentId), eq(assortmentTexts.locale, localeString)),
        )
        .limit(1);

      if (text) return text;

      // Try language code only
      if (localeString !== languageCode) {
        [text] = await db
          .select()
          .from(assortmentTexts)
          .where(
            and(
              eq(assortmentTexts.assortmentId, assortmentId),
              eq(assortmentTexts.locale, languageCode),
            ),
          )
          .limit(1);

        if (text) return text;
      }

      // Fallback to any available text
      [text] = await db
        .select()
        .from(assortmentTexts)
        .where(eq(assortmentTexts.assortmentId, assortmentId))
        .limit(1);

      return text || null;
    },

    updateTexts: async (
      assortmentId: string,
      texts: ({
        locale: AssortmentText['locale'];
      } & Omit<Partial<AssortmentText>, 'assortmentId' | 'locale'>)[],
    ): Promise<AssortmentText[]> => {
      const assortmentTextResults = await Promise.all(
        texts.map(async ({ locale, ...text }) =>
          upsertLocalizedText(assortmentId, new Intl.Locale(locale), text),
        ),
      );
      return assortmentTextResults.filter(Boolean) as AssortmentText[];
    },

    makeSlug,

    deleteMany: async ({
      assortmentId,
      excludedAssortmentIds,
    }: {
      assortmentId?: string;
      excludedAssortmentIds?: string[];
    }): Promise<number> => {
      // Note: assortment_texts_fts is synced automatically via triggers from createFTS
      let result;
      if (assortmentId) {
        result = await db.delete(assortmentTexts).where(eq(assortmentTexts.assortmentId, assortmentId));
      } else if (excludedAssortmentIds?.length) {
        result = await db
          .delete(assortmentTexts)
          .where(notInArray(assortmentTexts.assortmentId, excludedAssortmentIds));
      } else {
        result = await db.delete(assortmentTexts);
      }

      return result.rowsAffected || 0;
    },
  };
};

export type AssortmentTextsModule = ReturnType<typeof configureAssortmentTextsModule>;
