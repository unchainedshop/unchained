import { z } from 'zod';
import {
  PaginationSchema,
  SortingSchema,
  SearchSchema,
  LocalizationTextSchema,
} from '../../utils/sharedSchemas.js';

export const FilterTextInputSchema = LocalizationTextSchema.describe('Filter localized text data');

export const FilterOptionTextInputSchema = LocalizationTextSchema.extend({
  title: z.string().optional().describe('Optional localized title for the filter option'),
}).describe('Filter option localized text data');

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
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
  }),

  COUNT: z.object({
    ...SearchSchema,
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

  ...PaginationSchema,
  ...SortingSchema,
  ...SearchSchema,

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
