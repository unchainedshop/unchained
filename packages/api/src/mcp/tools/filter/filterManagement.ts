import { z } from 'zod';
import { Context } from '../../../context.js';
import { configureFilterMcpModule, FilterType } from '../../modules/configureFilterMcpModule.js';
import { log } from '@unchainedshop/logger';

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

const SortOptionInputSchema = z
  .object({
    key: z.string().min(1).describe('Field key to sort by (e.g., "key", "createdAt")'),
    value: z.enum(['ASC', 'DESC']).describe('Sort direction: ASC for ascending, DESC for descending'),
  })
  .strict();

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
  const { action, filterId } = params as any;
  log('MCP handler filterManagement ', { userId: context.userId, params });
  try {
    const filterModule = configureFilterMcpModule(context);

    switch (action) {
      case 'CREATE': {
        const { filter, texts } = params as any;
        if (!filter || !filter.key || !filter.type) {
          throw new Error('Filter data with key and type is required for CREATE action');
        }

        const created = await filterModule.create(
          filter as { key: string; type: FilterType; options?: string[] },
          texts,
        );

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: { filter: created },
              }),
            },
          ],
        };
      }

      case 'UPDATE': {
        const { updateData } = params;
        if (!filterId) {
          throw new Error('Filter ID is required for UPDATE action');
        }
        if (!updateData) {
          throw new Error('Update data is required for UPDATE action');
        }

        const updated = await filterModule.update(filterId, updateData);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: { filter: updated },
              }),
            },
          ],
        };
      }

      case 'REMOVE': {
        if (!filterId) {
          throw new Error('Filter ID is required for REMOVE action');
        }

        const removed = await filterModule.remove(filterId);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: { filter: removed },
              }),
            },
          ],
        };
      }

      case 'GET': {
        if (!filterId) {
          throw new Error('Filter ID is required for GET action');
        }

        const filter = await filterModule.get(filterId);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: { filter },
              }),
            },
          ],
        };
      }

      case 'LIST': {
        const { limit, offset, sort, includeInactive, queryString } = params;

        // Ensure sort has proper typing if provided
        const sortOptions =
          sort?.filter((s): s is { key: string; value: 'ASC' | 'DESC' } => Boolean(s.key && s.value)) ||
          undefined;

        const filters = await filterModule.list({
          limit,
          offset,
          sort: sortOptions,
          includeInactive,
          queryString,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: { filters },
              }),
            },
          ],
        };
      }

      case 'COUNT': {
        const { includeInactive, queryString } = params;

        const count = await filterModule.count({
          includeInactive,
          queryString,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: { count },
              }),
            },
          ],
        };
      }

      case 'CREATE_OPTION': {
        const { option, optionTexts } = params as any;
        if (!filterId) {
          throw new Error('Filter ID is required for CREATE_OPTION action');
        }
        if (!option) {
          throw new Error('Option value is required for CREATE_OPTION action');
        }

        const result = await filterModule.createOption(filterId, option, optionTexts);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: result,
              }),
            },
          ],
        };
      }

      case 'REMOVE_OPTION': {
        const { option } = params;
        if (!filterId) {
          throw new Error('Filter ID is required for REMOVE_OPTION action');
        }
        if (!option) {
          throw new Error('Option value is required for REMOVE_OPTION action');
        }

        const result = await filterModule.removeOption(filterId, option);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: result,
              }),
            },
          ],
        };
      }

      case 'UPDATE_TEXTS': {
        const { textUpdates, filterOptionValue } = params as any;
        if (!filterId) {
          throw new Error('Filter ID is required for UPDATE_TEXTS action');
        }
        if (!textUpdates || textUpdates.length === 0) {
          throw new Error('Text updates are required for UPDATE_TEXTS action');
        }

        const result = await filterModule.updateTexts(filterId, textUpdates, filterOptionValue);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: result,
              }),
            },
          ],
        };
      }

      case 'GET_TEXTS': {
        const { filterOptionValue } = params;
        if (!filterId) {
          throw new Error('Filter ID is required for GET_TEXTS action');
        }

        const result = await filterModule.getTexts(filterId, filterOptionValue);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: result,
              }),
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
