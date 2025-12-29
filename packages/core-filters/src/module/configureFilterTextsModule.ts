import { emit, registerEvents } from '@unchainedshop/events';
import { generateId, eq, and, inArray, isNull, notInArray, type DrizzleDb } from '@unchainedshop/store';
import { filterTexts, type FilterText } from '../db/schema.ts';

const FILTER_TEXT_EVENTS = ['FILTER_UPDATE_TEXT'];

export const configureFilterTextsModule = ({ db }: { db: DrizzleDb }) => {
  registerEvents(FILTER_TEXT_EVENTS);

  const upsertLocalizedText = async (
    params: { filterId: string; filterOptionValue?: string | null },
    locale: Intl.Locale,
    text: Omit<Partial<FilterText>, 'filterId' | 'filterOptionValue' | 'locale'>,
  ) => {
    const { filterId, filterOptionValue } = params;
    const localeString = locale.baseName;

    // Find existing text
    const existingConditions = [eq(filterTexts.filterId, filterId), eq(filterTexts.locale, localeString)];

    if (filterOptionValue) {
      existingConditions.push(eq(filterTexts.filterOptionValue, filterOptionValue));
    } else {
      existingConditions.push(isNull(filterTexts.filterOptionValue));
    }

    const [existing] = await db
      .select()
      .from(filterTexts)
      .where(and(...existingConditions))
      .limit(1);

    let filterText: FilterText;
    const now = new Date();

    if (existing) {
      // Update existing
      await db
        .update(filterTexts)
        .set({
          ...text,
          updated: now,
        })
        .where(eq(filterTexts._id, existing._id));

      [filterText] = await db.select().from(filterTexts).where(eq(filterTexts._id, existing._id)).limit(1);
    } else {
      // Insert new
      const textId = generateId();
      await db.insert(filterTexts).values({
        _id: textId,
        filterId,
        filterOptionValue: filterOptionValue || null,
        locale: localeString,
        created: now,
        ...text,
      });

      [filterText] = await db.select().from(filterTexts).where(eq(filterTexts._id, textId)).limit(1);
    }

    await emit('FILTER_UPDATE_TEXT', {
      filterId: params.filterId,
      filterOptionValue: params.filterOptionValue || null,
      text: filterText,
    });

    return filterText;
  };

  return {
    // Queries
    findTexts: async (query: {
      filterId?: string;
      filterIds?: string[];
      filterOptionValue?: string | null;
    }): Promise<FilterText[]> => {
      const conditions: ReturnType<typeof eq>[] = [];

      if (query.filterId) {
        conditions.push(eq(filterTexts.filterId, query.filterId));
      }

      if (query.filterIds?.length) {
        conditions.push(inArray(filterTexts.filterId, query.filterIds));
      }

      if (query.filterOptionValue !== undefined) {
        if (query.filterOptionValue) {
          conditions.push(eq(filterTexts.filterOptionValue, query.filterOptionValue));
        } else {
          conditions.push(isNull(filterTexts.filterOptionValue));
        }
      }

      if (conditions.length === 0) {
        return db.select().from(filterTexts);
      }

      return db
        .select()
        .from(filterTexts)
        .where(and(...conditions));
    },

    findLocalizedText: async ({
      filterId,
      filterOptionValue,
      locale,
    }: {
      filterId: string;
      filterOptionValue?: string;
      locale: Intl.Locale;
    }): Promise<FilterText | null> => {
      const localeString = locale.baseName;
      const languageCode = locale.language;

      const baseConditions = [eq(filterTexts.filterId, filterId)];

      if (filterOptionValue) {
        baseConditions.push(eq(filterTexts.filterOptionValue, filterOptionValue));
      } else {
        baseConditions.push(isNull(filterTexts.filterOptionValue));
      }

      // Try exact locale match first
      let [text] = await db
        .select()
        .from(filterTexts)
        .where(and(...baseConditions, eq(filterTexts.locale, localeString)))
        .limit(1);

      if (text) return text;

      // Try language code only
      if (localeString !== languageCode) {
        [text] = await db
          .select()
          .from(filterTexts)
          .where(and(...baseConditions, eq(filterTexts.locale, languageCode)))
          .limit(1);

        if (text) return text;
      }

      // Fallback to any available text
      [text] = await db
        .select()
        .from(filterTexts)
        .where(and(...baseConditions))
        .limit(1);

      return text || null;
    },

    // Mutations
    updateTexts: async (
      params: { filterId: string; filterOptionValue?: string | null },
      texts: ({
        locale: FilterText['locale'];
      } & Omit<Partial<FilterText>, 'filterId' | 'filterOptionValue' | 'locale'>)[],
    ) => {
      const updatedTexts = await Promise.all(
        texts.map(async ({ locale, ...text }) => upsertLocalizedText(params, new Intl.Locale(locale), text)),
      );

      return updatedTexts.filter(Boolean) as FilterText[];
    },

    deleteMany: async ({
      filterId,
      excludedFilterIds,
    }: {
      filterId?: string;
      excludedFilterIds?: string[];
    }): Promise<number> => {
      let result;

      if (filterId) {
        result = await db.delete(filterTexts).where(eq(filterTexts.filterId, filterId));
      } else if (excludedFilterIds?.length) {
        result = await db.delete(filterTexts).where(notInArray(filterTexts.filterId, excludedFilterIds));
      } else {
        result = await db.delete(filterTexts);
      }

      return result.rowsAffected || 0;
    },
  };
};

export type FilterTextsModule = ReturnType<typeof configureFilterTextsModule>;
