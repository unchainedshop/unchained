import { z } from 'zod';

export const FilterTextInputSchema = z.object({
  locale: z
    .string()
    .min(1)
    .describe(
      'locale iso code like "en-US", "de-CH" use default defaultLanguageIsoCode in shop info if not explicitly provided. if language is explicitly provided check if it exists',
    ),
  title: z.string().min(1).describe('Title of the filter in the specified locale'),
  subtitle: z.string().optional().describe('Optional subtitle for additional context'),
});

export const FilterOptionTextInputSchema = z.object({
  locale: z
    .string()
    .min(1)
    .describe(
      'locale iso code like "en-US", "de-CH" use default defaultLanguageIsoCode in shop info if not explicitly provided. if language is explicitly provided check if it exists',
    ),
  title: z.string().optional().describe('Optional localized title for the filter option'),
  subtitle: z.string().optional().describe('Optional localized subtitle for the filter option'),
});

export const SortOptionInputSchema = z
  .object({
    key: z.string().min(1).describe('Field key to sort by (e.g., "key", "createdAt")'),
    value: z.enum(['ASC', 'DESC']).describe('Sort direction: ASC for ascending, DESC for descending'),
  })
  .strict();

export const CreateFilterInputSchema = z.object({
  key: z.string().min(1).describe('Unique key for the filter'),
  type: z.enum(['SWITCH', 'SINGLE_CHOICE', 'MULTI_CHOICE', 'RANGE']).describe('Type of the filter'),
  options: z.array(z.string().min(1)).optional().describe('Selectable options (if applicable)'),
});

export const UpdateFilterInputSchema = z.object({
  isActive: z.boolean().optional().describe('Whether the filter should be active or not'),
  key: z.string().min(1).optional().describe('New unique key for the filter (if updating)'),
});

export const FilterUpdateTextInputSchema = z.object({
  locale: z.string().min(1).describe('Locale ISO code (e.g., "en-US", "de-CH")'),
  title: z.string().optional().describe('Title for the filter or filter option in the specified locale'),
  subtitle: z
    .string()
    .optional()
    .describe('Subtitle for the filter or filter option in the specified locale'),
});

export const actionValidators = {
  CREATE: z.object({
    filter: CreateFilterInputSchema.describe('Filter data'),
    texts: z.array(FilterTextInputSchema).optional().describe('Localized text entries'),
  }),

  UPDATE: z.object({
    filterId: z.string().min(1).describe('Unique filter identifier'),
    updateData: UpdateFilterInputSchema.describe('Filter updates'),
  }),

  REMOVE: z.object({
    filterId: z.string().min(1).describe('Unique filter identifier'),
  }),

  GET: z.object({
    filterId: z.string().min(1).describe('Unique filter identifier'),
  }),

  LIST: z.object({
    limit: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe('Maximum filters per page (Range: 1-100, default: 20)'),
    offset: z.number().min(0).optional().describe('Number of filters to skip for pagination'),
    includeInactive: z
      .boolean()
      .optional()
      .describe('Whether to include inactive/disabled filters in results (Default: false)'),
    queryString: z
      .string()
      .optional()
      .describe('Search term to filter by filter key or title (supports partial matching)'),
    sort: z
      .array(SortOptionInputSchema)
      .optional()
      .describe('Sort order for results - array of {key, value} pairs'),
  }),

  COUNT: z.object({
    includeInactive: z
      .boolean()
      .optional()
      .describe('Whether to include inactive/disabled filters in results'),
    queryString: z.string().optional().describe('Search term to filter by filter key or title'),
  }),

  CREATE_OPTION: z.object({
    filterId: z.string().min(1).describe('Unique filter identifier'),
    option: z.string().min(1).describe('Option value string - must be unique within the filter'),
    optionTexts: z
      .array(FilterOptionTextInputSchema)
      .optional()
      .describe('Localized titles/subtitles - optional, can be added later via UPDATE_TEXTS'),
  }),

  REMOVE_OPTION: z.object({
    filterId: z.string().min(1).describe('Unique filter identifier'),
    option: z.string().min(1).describe('Option value to remove'),
  }),

  UPDATE_TEXTS: z.object({
    filterId: z.string().min(1).describe('Unique filter identifier'),
    textUpdates: z
      .array(FilterUpdateTextInputSchema)
      .min(1)
      .describe(
        'Array of localized text updates - each entry contains locale, title, and optional subtitle',
      ),
    filterOptionValue: z
      .string()
      .optional()
      .describe(
        'Specific filter option value for text operations - omit to work with main filter texts',
      ),
  }),

  GET_TEXTS: z.object({
    filterId: z.string().min(1).describe('Unique filter identifier'),
    filterOptionValue: z
      .string()
      .optional()
      .describe('Specific filter option value - omit to get main filter texts'),
  }),
} as const;

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

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (filterModule: any, params: Params<T>) => Promise<unknown>;
