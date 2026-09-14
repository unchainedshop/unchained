import { z } from 'zod/v4-mini';
import { SearchSchema, createManagementSchemaFromValidators } from '../../utils/sharedSchemas.ts';
import {
  ProviderTypeEnum,
  ProviderSubtypeSchema,
  ProviderSubtypeSchemas,
  providerSubtypeDescription,
  type ProviderType,
} from '../../utils/providerSchemas.ts';

export {
  ProviderTypeEnum,
  PaymentProviderTypeEnum,
  DeliveryProviderTypeEnum,
  WarehousingProviderTypeEnum,
} from '../../utils/providerSchemas.ts';

const TypeFilterSchema = z
  .optional(ProviderSubtypeSchema)
  .check(
    z.describe(
      `Optional filter by specific subtype: ${providerSubtypeDescription}; must match providerType`,
    ),
  );

const matchingTypeFilter = z.refine<{ providerType: ProviderType; typeFilter?: string }>(
  ({ providerType, typeFilter }) =>
    typeFilter === undefined || ProviderSubtypeSchemas[providerType].safeParse(typeFilter).success,
  { message: 'Subtype must match the providerType category', path: ['typeFilter'] },
);

export const ConfigurationEntry = z.strictObject({
  key: z
    .string()
    .check(
      z.minLength(1),
      z.describe('Configuration parameter name (e.g., "apiKey", "webhookUrl", "sandbox")'),
    ),
  value: z
    .union([z.string(), z.number(), z.boolean(), z.record(z.any(), z.any())])
    .check(
      z.describe(
        'Configuration parameter value (string, number, boolean, or object depending on the setting)',
      ),
    ),
});

export const ProviderConfigSchema = z.object({
  type: ProviderSubtypeSchema.check(
    z.describe(
      `Specific provider subtype: ${providerSubtypeDescription}; must match providerType category`,
    ),
  ),
  adapterKey: z
    .string()
    .check(
      z.minLength(1),
      z.describe(
        'Unique adapter key that identifies the specific provider implementation - get available keys with the provider_management INTERFACES action',
      ),
    ),
});

export const actionValidators = {
  CREATE: z
    .object({
      providerType: ProviderTypeEnum.check(z.describe('Type of provider system to operate on')),
      provider: ProviderConfigSchema.check(
        z.describe('Provider configuration including type and adapter'),
      ),
    })
    .check(
      z.refine(
        ({ providerType, provider }) =>
          ProviderSubtypeSchemas[providerType].safeParse(provider.type).success,
        { message: 'Subtype must match the providerType category', path: ['provider', 'type'] },
      ),
    ),

  UPDATE: z.object({
    providerType: ProviderTypeEnum.check(z.describe('Type of provider system to operate on')),
    providerId: z
      .string()
      .check(z.minLength(1), z.describe('Unique identifier of the specific provider instance')),
    configuration: z.array(ConfigurationEntry).check(
      z.minLength(1),
      z.describe(
        'Array of configuration key-value pairs to update - each provider adapter has different required/optional configuration parameters',
      ),
      z.refine(
        (data) => {
          const keys = data.map((entry) => entry.key);
          return new Set(keys).size === keys.length;
        },
        {
          message: 'Duplicate configuration keys are not allowed - each key must be unique.',
        },
      ),
    ),
  }),

  REMOVE: z.object({
    providerType: ProviderTypeEnum.check(z.describe('Type of provider system to operate on')),
    providerId: z
      .string()
      .check(z.minLength(1), z.describe('Unique identifier of the specific provider instance')),
  }),

  GET: z.object({
    providerType: ProviderTypeEnum.check(z.describe('Type of provider system to operate on')),
    providerId: z
      .string()
      .check(z.minLength(1), z.describe('Unique identifier of the specific provider instance')),
  }),

  LIST: z
    .object({
      providerType: ProviderTypeEnum.check(z.describe('Type of provider system to operate on')),
      typeFilter: TypeFilterSchema,
      ...SearchSchema,
    })
    .check(matchingTypeFilter),

  INTERFACES: z
    .object({
      providerType: ProviderTypeEnum.check(z.describe('Type of provider system to operate on')),
      typeFilter: TypeFilterSchema,
    })
    .check(matchingTypeFilter),
} as const;

export const ProviderManagementSchema = createManagementSchemaFromValidators(actionValidators);

export type { ManagementParams as ProviderManagementParams } from '../../utils/sharedSchemas.ts';

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (providerModule: any, params: Params<T>) => Promise<unknown>;
