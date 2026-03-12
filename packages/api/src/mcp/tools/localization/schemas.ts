import { z } from 'zod/v4-mini';
import { SortDirection } from '@unchainedshop/utils';
import {
  PaginationSchema,
  SortingSchema,
  SearchSchema,
  createManagementSchemaFromValidators,
} from '../../utils/sharedSchemas.ts';

export const sortDirectionKeys = Object.keys(SortDirection) as [
  keyof typeof SortDirection,
  ...(keyof typeof SortDirection)[],
];

export const LocalizationTypeEnum = z
  .enum(['COUNTRY', 'CURRENCY', 'LANGUAGE'])
  .check(
    z.describe(
      'Type of localization entity - COUNTRY for geographic regions (US, DE, CH), CURRENCY for monetary units (USD, EUR, CHF), LANGUAGE for locale support (en, de, fr)',
    ),
  );

export const LocalizationEntitySchema = z.object({
  isoCode: z
    .optional(z.string().check(z.minLength(1)))
    .check(
      z.describe(
        'ISO identifier: Countries need 2-letter codes (US, DE), Currencies need 3-letter codes (USD, EUR), Languages accept 2-10 characters (en, de-CH). isoCode is required for both CREATE and UPDATE operations',
      ),
    ),
  isActive: z
    .optional(z.boolean())
    .check(
      z.describe(
        'Active status for the entity - used for all localization types (COUNTRY, CURRENCY, LANGUAGE)',
      ),
    ),
  defaultCurrencyCode: z
    .optional(z.string())
    .check(
      z.describe(
        'Default currency code for the country - only used when localizationType is COUNTRY, ignored otherwise',
      ),
    ),
  contractAddress: z
    .optional(
      z
        .string()
        .check(
          z.regex(
            /^0x[a-fA-F0-9]{40}$/,
            'Must be a valid 42-character blockchain address starting with 0x',
          ),
        ),
    )
    .check(
      z.describe(
        'Blockchain contract address for tokenized currencies - only used when localizationType is CURRENCY, ignored otherwise',
      ),
    ),
  decimals: z
    .optional(z.int().check(z.nonnegative()))
    .check(
      z.describe(
        'Decimal precision for currency calculations - only used when localizationType is CURRENCY (2 for traditional currencies like USD, 18 for crypto tokens), ignored otherwise',
      ),
    ),
});

export const actionValidators = {
  CREATE: z.object({
    localizationType: LocalizationTypeEnum.check(
      z.describe('Type of localization system to operate on'),
    ),
    entity: z
      .extend(LocalizationEntitySchema, {
        isoCode: z
          .string()
          .check(
            z.minLength(1),
            z.describe(
              'ISO identifier: Countries need 2-letter codes (US, DE), Currencies need 3-letter codes (USD, EUR), Languages accept 2-10 characters (en, de-CH)',
            ),
          ),
      })
      .check(z.describe('Entity configuration data (required for CREATE)')),
  }),

  UPDATE: z.object({
    localizationType: LocalizationTypeEnum.check(
      z.describe('Type of localization system to operate on, wj'),
    ),
    entityId: z
      .string()
      .check(z.minLength(1), z.describe('Database ID of the specific entity instance')),
    entity: LocalizationEntitySchema.check(z.describe('Entity data to update')),
  }),

  REMOVE: z.object({
    localizationType: LocalizationTypeEnum.check(
      z.describe('Type of localization system to operate on'),
    ),
    entityId: z
      .string()
      .check(z.minLength(1), z.describe('Database ID of the specific entity instance')),
  }),

  GET: z.object({
    localizationType: LocalizationTypeEnum.check(
      z.describe('Type of localization system to operate on'),
    ),
    entityId: z
      .string()
      .check(z.minLength(1), z.describe('Database ID of the specific entity instance')),
  }),

  LIST: z.object({
    localizationType: LocalizationTypeEnum.check(
      z.describe('Type of localization system to operate on'),
    ),
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
  }),

  COUNT: z.object({
    localizationType: LocalizationTypeEnum.check(
      z.describe('Type of localization system to operate on'),
    ),
    ...SearchSchema,
  }),
} as const;

export const LocalizationManagementSchema = createManagementSchemaFromValidators(actionValidators);

export type { ManagementParams as LocalizationManagementParams } from '../../utils/sharedSchemas.ts';

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (
  localizationModule: any,
  params: Params<T>,
) => Promise<unknown>;
