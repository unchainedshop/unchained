import { z } from 'zod/v4-mini';
import { SearchSchema, createManagementSchemaFromValidators } from '../../utils/sharedSchemas.ts';

export const ProviderTypeEnum = z
  .enum(['PAYMENT', 'DELIVERY', 'WAREHOUSING'])
  .check(
    z.describe(
      'Type of provider - PAYMENT for payment processing (cards, invoices), DELIVERY for shipping/pickup methods, WAREHOUSING for inventory management',
    ),
  );

export const PaymentProviderTypeEnum = z.enum(['CARD', 'INVOICE', 'GENERIC']);
export const DeliveryProviderTypeEnum = z.enum(['PICKUP', 'SHIPPING', 'LOCAL']);
export const WarehousingProviderTypeEnum = z.enum(['PHYSICAL', 'VIRTUAL']);

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
  type: z
    .union([PaymentProviderTypeEnum, DeliveryProviderTypeEnum, WarehousingProviderTypeEnum])
    .check(
      z.describe(
        'Specific provider subtype: PAYMENT types (CARD, INVOICE, GENERIC), DELIVERY types (PICKUP, SHIPPING, LOCAL), WAREHOUSING types (PHYSICAL, VIRTUAL) - must match providerType category',
      ),
    ),
  adapterKey: z
    .string()
    .check(
      z.minLength(1),
      z.describe(
        'Unique adapter key that identifies the specific provider implementation - get available keys from provider_interfaces tool',
      ),
    ),
});

export const actionValidators = {
  CREATE: z.object({
    providerType: ProviderTypeEnum.check(z.describe('Type of provider system to operate on')),
    provider: ProviderConfigSchema.check(
      z.describe('Provider configuration including type and adapter'),
    ),
  }),

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

  LIST: z.object({
    providerType: ProviderTypeEnum.check(z.describe('Type of provider system to operate on')),
    typeFilter: z
      .optional(
        z.union([PaymentProviderTypeEnum, DeliveryProviderTypeEnum, WarehousingProviderTypeEnum]),
      )
      .check(
        z.describe(
          'Optional filter by specific subtype: PAYMENT (CARD, INVOICE, GENERIC), DELIVERY (PICKUP, SHIPPING, LOCAL), WAREHOUSING (PHYSICAL, VIRTUAL)',
        ),
      ),
    ...SearchSchema,
  }),

  INTERFACES: z.object({
    providerType: ProviderTypeEnum.check(z.describe('Type of provider system to operate on')),
    typeFilter: z
      .optional(
        z.union([PaymentProviderTypeEnum, DeliveryProviderTypeEnum, WarehousingProviderTypeEnum]),
      )
      .check(
        z.describe(
          'Optional filter by specific subtype: PAYMENT (CARD, INVOICE, GENERIC), DELIVERY (PICKUP, SHIPPING, LOCAL), WAREHOUSING (PHYSICAL, VIRTUAL)',
        ),
      ),
  }),
} as const;

export const ProviderManagementSchema = createManagementSchemaFromValidators(actionValidators);

export type { ManagementParams as ProviderManagementParams } from '../../utils/sharedSchemas.ts';

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (providerModule: any, params: Params<T>) => Promise<unknown>;
