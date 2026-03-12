import { z } from 'zod/v4-mini';
import {
  PaginationSchema,
  SortingSchema,
  SearchSchema,
  LocalizationTextSchema,
  createManagementSchemaFromValidators,
} from '../../utils/sharedSchemas.ts';

export const FilterTextInputSchema = LocalizationTextSchema.check(
  z.describe('Filter localized text data'),
);

export const FilterOptionTextInputSchema = z
  .extend(LocalizationTextSchema, {
    title: z.optional(z.string()).check(z.describe('Optional localized title for the filter option')),
  })
  .check(z.describe('Filter option localized text data'));

export const SortOptionInputSchema = z.strictObject({
  key: z.string().check(z.minLength(1), z.describe('Field key to sort by (e.g., "key", "createdAt")')),
  value: z
    .enum(['ASC', 'DESC'])
    .check(z.describe('Sort direction: ASC for ascending, DESC for descending')),
});

export const CreateFilterInputSchema = z.object({
  key: z.string().check(z.minLength(1), z.describe('Unique key for the filter')),
  type: z
    .enum(['SWITCH', 'SINGLE_CHOICE', 'MULTI_CHOICE', 'RANGE'])
    .check(z.describe('Type of the filter')),
  options: z
    ._default(z.array(z.string().check(z.minLength(1))), [])
    .check(z.describe('Selectable options (if applicable)')),
});

export const UpdateFilterInputSchema = z.object({
  isActive: z.optional(z.boolean()).check(z.describe('Whether the filter should be active or not')),
  key: z
    .optional(z.string().check(z.minLength(1)))
    .check(z.describe('New unique key for the filter (if updating)')),
});

export const FilterUpdateTextInputSchema = z.object({
  locale: z.string().check(z.minLength(1), z.describe('Locale ISO code (e.g., "en-US", "de-CH")')),
  title: z
    .optional(z.string())
    .check(z.describe('Title for the filter or filter option in the specified locale')),
  subtitle: z
    .optional(z.string())
    .check(z.describe('Subtitle for the filter or filter option in the specified locale')),
});

export const actionValidators = {
  CREATE: z.object({
    filter: CreateFilterInputSchema.check(z.describe('Filter data')),
    texts: z.optional(z.array(FilterTextInputSchema)).check(z.describe('Localized text entries')),
  }),

  UPDATE: z.object({
    filterId: z.string().check(z.minLength(1), z.describe('Unique filter identifier')),
    updateData: UpdateFilterInputSchema.check(z.describe('Filter updates')),
  }),

  REMOVE: z.object({
    filterId: z.string().check(z.minLength(1), z.describe('Unique filter identifier')),
  }),

  GET: z.object({
    filterId: z.string().check(z.minLength(1), z.describe('Unique filter identifier')),
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
    filterId: z.string().check(z.minLength(1), z.describe('Unique filter identifier')),
    option: z
      .string()
      .check(z.minLength(1), z.describe('Option value string - must be unique within the filter')),
    optionTexts: z
      .array(FilterOptionTextInputSchema)
      .check(z.describe('Localized titles/subtitles - can be added later via UPDATE_TEXTS')),
  }),

  REMOVE_OPTION: z.object({
    filterId: z.string().check(z.minLength(1), z.describe('Unique filter identifier')),
    option: z.string().check(z.minLength(1), z.describe('Option value to remove')),
  }),

  UPDATE_TEXTS: z.object({
    filterId: z.string().check(z.minLength(1), z.describe('Unique filter identifier')),
    textUpdates: z
      .array(FilterUpdateTextInputSchema)
      .check(
        z.minLength(1),
        z.describe(
          'Array of localized text updates - each entry contains locale, title, and optional subtitle',
        ),
      ),
    filterOptionValue: z
      .optional(z.string())
      .check(
        z.describe(
          'Specific filter option value for text operations - omit to work with main filter texts',
        ),
      ),
  }),

  GET_TEXTS: z.object({
    filterId: z.string().check(z.minLength(1), z.describe('Unique filter identifier')),
    filterOptionValue: z
      .optional(z.string())
      .check(z.describe('Specific filter option value - omit to get main filter texts')),
  }),
} as const;

export const FilterManagementSchema = createManagementSchemaFromValidators(actionValidators);

export type { ManagementParams as FilterManagementParams } from '../../utils/sharedSchemas.ts';

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (filterModule: any, params: Params<T>) => Promise<unknown>;
