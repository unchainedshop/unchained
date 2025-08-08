import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { FilterDirector } from '@unchainedshop/core';
import { FilterNotFoundError } from '../../../errors.js';
import { getNormalizedFilterDetails } from '../../utils/getNormalizedFilterDetails.js';

const FilterTextInputSchema = z.object({
  locale: z
    .string()
    .min(1)
    .describe(
      'locale iso code like "en-US", "de-CH" use default defaultLanguageIsoCode in shop info if not explicitly provided. if language is explicitly provided check if it exists',
    ),
  title: z.string().min(1).describe('Title of the filter in the specified locale'),
  subtitle: z.string().optional().describe('Optional subtitle for additional context'),
});

const FilterOptionTextInputSchema = z.object({
  locale: z
    .string()
    .min(1)
    .describe(
      'locale iso code like "en-US", "de-CH" use default defaultLanguageIsoCode in shop info if not explicitly provided. if language is explicitly provided check if it exists',
    ),
  title: z.string().optional().describe('Optional localized title for the filter option'),
  subtitle: z.string().optional().describe('Optional localized subtitle for the filter option'),
});

const SortOptionInputSchema = z.object({
  key: z.string().min(1).describe('Field key to sort by (e.g., "key", "createdAt")'),
  value: z.enum(['ASC', 'DESC']).describe('Sort direction: ASC for ascending, DESC for descending'),
});

const CreateFilterInputSchema = z.object({
  key: z.string().min(1).describe('Unique key for the filter'),
  type: z.enum(['SWITCH', 'SINGLE_CHOICE', 'MULTI_CHOICE', 'RANGE']).describe('Type of the filter'),
  options: z.array(z.string().min(1)).optional().describe('Selectable options (if applicable)'),
});

const UpdateFilterInputSchema = z.object({
  isActive: z.boolean().optional().describe('Whether the filter should be active or not'),
  key: z.string().min(1).optional().describe('New unique key for the filter (if updating)'),
});

const FilterUpdateTextInputSchema = z.object({
  locale: z.string().min(1).describe('Locale ISO code (e.g., "en-US", "de-CH")'),
  title: z.string().optional().describe('Title for the filter or filter option in the specified locale'),
  subtitle: z
    .string()
    .optional()
    .describe('Subtitle for the filter or filter option in the specified locale'),
});

export const FilterManagementSchema = {
  action: z
    .enum([
      'CREATE',
      'UPDATE',
      'REMOVE',
      'GET',
      'LIST',
      'COUNT',
      'CREATE_OPTION',
      'REMOVE_OPTION',
      'UPDATE_TEXTS',
      'GET_TEXTS',
    ])
    .describe(
      'Action to perform: CREATE (new filter), UPDATE (modify filter), REMOVE (delete filter), GET (retrieve filter), LIST (search filters), COUNT (count filters), CREATE_OPTION (add filter option), REMOVE_OPTION (delete filter option), UPDATE_TEXTS (modify localized texts), GET_TEXTS (retrieve localized texts)',
    ),

  filterId: z
    .string()
    .min(1)
    .optional()
    .describe(
      'Unique filter identifier. Required for: UPDATE, REMOVE, GET, CREATE_OPTION, REMOVE_OPTION, UPDATE_TEXTS, GET_TEXTS. Not needed for: CREATE, LIST, COUNT',
    ),

  filter: CreateFilterInputSchema.optional().describe('Filter data for CREATE action'),
  texts: z.array(FilterTextInputSchema).optional().describe('Localized text entries for CREATE action'),

  updateData: UpdateFilterInputSchema.optional().describe('Filter updates for UPDATE action'),

  limit: z
    .number()
    .min(1)
    .max(100)
    .default(20)
    .describe('Maximum filters per page (LIST action only). Range: 1-100, default: 20'),
  offset: z
    .number()
    .min(0)
    .default(0)
    .describe('Number of filters to skip for pagination (LIST action only). Use with limit for paging'),
  includeInactive: z
    .boolean()
    .default(false)
    .describe(
      'Whether to include inactive/disabled filters in results (LIST/COUNT actions). Default: false (active only)',
    ),
  queryString: z
    .string()
    .optional()
    .describe(
      'Search term to filter by filter key or title (LIST/COUNT actions). Supports partial matching',
    ),
  sort: z
    .array(SortOptionInputSchema)
    .optional()
    .describe(
      'Sort order for results (LIST action only). Array of {key, value} pairs where key is field name and value is ASC/DESC',
    ),

  option: z
    .string()
    .min(1)
    .optional()
    .describe(
      'Option value string for CREATE_OPTION/REMOVE_OPTION actions. Must be unique within the filter',
    ),
  optionTexts: z
    .array(FilterOptionTextInputSchema)
    .optional()
    .describe(
      'Localized titles/subtitles for CREATE_OPTION action. Optional - can be added later via UPDATE_TEXTS',
    ),

  filterOptionValue: z
    .string()
    .optional()
    .describe(
      'Specific filter option value for text operations (UPDATE_TEXTS/GET_TEXTS). Omit to work with main filter texts',
    ),
  textUpdates: z
    .array(FilterUpdateTextInputSchema)
    .optional()
    .describe(
      'Array of localized text updates for UPDATE_TEXTS action. Each entry contains locale, title, and optional subtitle',
    ),
};

export const FilterManagementZodSchema = z.object(FilterManagementSchema);
export type FilterManagementParams = z.infer<typeof FilterManagementZodSchema>;

export async function filterManagement(context: Context, params: FilterManagementParams) {
  const { action, filterId } = params;
  const { modules, userId } = context;

  try {
    log('handler filterManagement', { userId, params });

    switch (action) {
      case 'CREATE': {
        const { filter, texts = [] } = params;
        if (!filter) throw new Error('Filter data is required for CREATE action');

        const newFilter = await modules.filters.create(filter as any);
        await FilterDirector.invalidateProductIdCache(newFilter, context);

        if (texts.length > 0) {
          await modules.filters.texts.updateTexts({ filterId: newFilter._id }, texts);
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ filter: await getNormalizedFilterDetails(newFilter._id, context) }),
            },
          ],
        };
      }

      case 'UPDATE': {
        if (!filterId) throw new Error('filterId is required for UPDATE action');
        const { updateData } = params;
        if (!updateData) throw new Error('updateData is required for UPDATE action');

        if (!(await modules.filters.filterExists({ filterId }))) {
          throw new FilterNotFoundError({ filterId });
        }

        const updatedFilter = await modules.filters.update(filterId, updateData as any);
        await FilterDirector.invalidateProductIdCache(updatedFilter, context);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ filter: await getNormalizedFilterDetails(filterId, context) }),
            },
          ],
        };
      }

      case 'REMOVE': {
        if (!filterId) throw new Error('filterId is required for REMOVE action');

        const filter = await getNormalizedFilterDetails(filterId, context);
        if (!filter) throw new FilterNotFoundError({ filterId });

        await modules.assortments.filters.deleteMany({ filterId });
        await modules.filters.delete(filterId);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ filter }),
            },
          ],
        };
      }

      case 'GET': {
        if (!filterId) throw new Error('filterId is required for GET action');

        const filter = await getNormalizedFilterDetails(filterId, context);
        if (!filter) throw new FilterNotFoundError({ filterId });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ filter }),
            },
          ],
        };
      }

      case 'LIST': {
        const { limit, offset, includeInactive, queryString, sort } = params;
        const searchParams = { limit, offset, includeInactive, queryString, sort };

        const filters = await modules.filters.findFilters(searchParams as any);
        const normalizedFilters = await Promise.all(
          filters.map(async ({ _id }) => getNormalizedFilterDetails(_id, context)),
        );

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ filters: normalizedFilters }),
            },
          ],
        };
      }

      case 'COUNT': {
        const { includeInactive, queryString } = params;
        const searchParams = { includeInactive, queryString };

        const count = await modules.filters.count(searchParams as any);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ count }),
            },
          ],
        };
      }

      case 'CREATE_OPTION': {
        if (!filterId) throw new Error('filterId is required for CREATE_OPTION action');
        const { option, optionTexts = [] } = params;
        if (!option) throw new Error('option is required for CREATE_OPTION action');

        const filter = await modules.filters.findFilter({ filterId });
        if (!filter) throw new FilterNotFoundError({ filterId });

        const newOptions = await modules.filters.createFilterOption(filterId, { value: option });
        await FilterDirector.invalidateProductIdCache(newOptions, context);

        if (optionTexts.length > 0) {
          await modules.filters.texts.updateTexts({ filterId, filterOptionValue: option }, optionTexts);
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ filter: await getNormalizedFilterDetails(filterId, context) }),
            },
          ],
        };
      }

      case 'REMOVE_OPTION': {
        if (!filterId) throw new Error('filterId is required for REMOVE_OPTION action');
        const { option: filterOptionValue } = params;
        if (!filterOptionValue) throw new Error('option is required for REMOVE_OPTION action');

        const filter = await modules.filters.findFilter({ filterId });
        if (!filter) throw new FilterNotFoundError({ filterId });

        const removedFilterOption = await modules.filters.removeFilterOption({
          filterId,
          filterOptionValue,
        });
        await FilterDirector.invalidateProductIdCache(removedFilterOption, context);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ filter: await getNormalizedFilterDetails(filterId, context) }),
            },
          ],
        };
      }

      case 'UPDATE_TEXTS': {
        if (!filterId) throw new Error('filterId is required for UPDATE_TEXTS action');
        const { filterOptionValue, textUpdates } = params;
        if (!textUpdates || textUpdates.length === 0) {
          throw new Error('textUpdates is required for UPDATE_TEXTS action');
        }

        const filter = await getNormalizedFilterDetails(filterId, context);
        if (!filter) throw new FilterNotFoundError({ filterId });

        const updatedTexts = await modules.filters.texts.updateTexts(
          { filterId, filterOptionValue },
          textUpdates,
        );

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ filterTexts: updatedTexts }),
            },
          ],
        };
      }

      case 'GET_TEXTS': {
        if (!filterId) throw new Error('filterId is required for GET_TEXTS action');
        const { filterOptionValue } = params;

        const filter = await modules.filters.findFilter({ filterId });
        if (!filter) throw new FilterNotFoundError({ filterId });

        const texts = await modules.filters.texts.findTexts({
          filterId,
          filterOptionValue: filterOptionValue || null,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ texts }),
            },
          ],
        };
      }

      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error in filter ${action.toLowerCase()}: ${(error as Error).message}`,
        },
      ],
    };
  }
}
