import { z } from 'zod';
import { SortDirection } from '@unchainedshop/utils';
import { PaginationSchema, SortingSchema, SearchSchema } from '../../utils/sharedSchemas.js';

export const sortDirectionKeys = Object.keys(SortDirection) as [
  keyof typeof SortDirection,
  ...(keyof typeof SortDirection)[],
];

export const LocalizationTypeEnum = z.enum(['COUNTRY', 'CURRENCY', 'LANGUAGE'], {
  description:
    'Type of localization entity - COUNTRY for geographic regions (US, DE, CH), CURRENCY for monetary units (USD, EUR, CHF), LANGUAGE for locale support (en, de, fr)',
});

export const LocalizationEntitySchema = z.object({
  isoCode: z
    .string()
    .min(1)
    .optional()
    .describe(
      'ISO identifier: Countries need 2-letter codes (US, DE), Currencies need 3-letter codes (USD, EUR), Languages accept 2-10 characters (en, de-CH). isoCode is required for both CREATE and UPDATE operations',
    ),
  isActive: z
    .boolean()
    .optional()
    .describe(
      'Active status for the entity - used for all localization types (COUNTRY, CURRENCY, LANGUAGE)',
    ),
  defaultCurrencyCode: z
    .string()
    .optional()
    .describe(
      'Default currency code for the country - only used when localizationType is COUNTRY, ignored otherwise',
    ),
  contractAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid 42-character blockchain address starting with 0x')
    .optional()
    .describe(
      'Blockchain contract address for tokenized currencies - only used when localizationType is CURRENCY, ignored otherwise',
    ),
  decimals: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe(
      'Decimal precision for currency calculations - only used when localizationType is CURRENCY (2 for traditional currencies like USD, 18 for crypto tokens), ignored otherwise',
    ),
});

export const actionValidators = {
  CREATE: z.object({
    localizationType: LocalizationTypeEnum.describe('Type of localization system to operate on'),
    entity: LocalizationEntitySchema.extend({
      isoCode: z
        .string()
        .min(1)
        .describe(
          'ISO identifier: Countries need 2-letter codes (US, DE), Currencies need 3-letter codes (USD, EUR), Languages accept 2-10 characters (en, de-CH)',
        ),
    }).describe('Entity configuration data (required for CREATE)'),
  }),

  UPDATE: z.object({
    localizationType: LocalizationTypeEnum.describe('Type of localization system to operate on, wj'),
    entityId: z.string().min(1).describe('Database ID of the specific entity instance'),
    entity: LocalizationEntitySchema.describe('Entity data to update'),
  }),

  REMOVE: z.object({
    localizationType: LocalizationTypeEnum.describe('Type of localization system to operate on'),
    entityId: z.string().min(1).describe('Database ID of the specific entity instance'),
  }),

  GET: z.object({
    localizationType: LocalizationTypeEnum.describe('Type of localization system to operate on'),
    entityId: z.string().min(1).describe('Database ID of the specific entity instance'),
  }),

  LIST: z.object({
    localizationType: LocalizationTypeEnum.describe('Type of localization system to operate on'),
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
  }),

  COUNT: z.object({
    localizationType: LocalizationTypeEnum.describe('Type of localization system to operate on'),
    ...SearchSchema,
  }),
} as const;

export const LocalizationManagementSchema = {
  action: z
    .enum(['CREATE', 'UPDATE', 'REMOVE', 'GET', 'LIST', 'COUNT'])
    .describe(
      'Localization action: CREATE (new entity), UPDATE (modify existing), REMOVE (soft delete), GET (retrieve single), LIST (find multiple with pagination), COUNT (get totals for analytics)',
    ),

  localizationType: LocalizationTypeEnum.describe('Type of localization system to operate on'),
  entity: LocalizationEntitySchema.optional().describe(
    'Entity configuration data (required for CREATE, optional for UPDATE)',
  ),
  entityId: z
    .string()
    .min(1)
    .optional()
    .describe('Database ID of the specific entity instance (required for UPDATE, REMOVE, GET actions)'),
  ...PaginationSchema,
  ...SortingSchema,
  ...SearchSchema,
};

export const LocalizationManagementZodSchema = z.object(LocalizationManagementSchema);
export type LocalizationManagementParams = z.infer<typeof LocalizationManagementZodSchema>;

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (
  localizationModule: any,
  params: Params<T>,
) => Promise<unknown>;
