import { z } from 'zod';

export const ProviderTypeEnum = z.enum(['PAYMENT', 'DELIVERY', 'WAREHOUSING'], {
  description:
    'Type of provider - PAYMENT for payment processing (cards, invoices), DELIVERY for shipping/pickup methods, WAREHOUSING for inventory management',
});

export const PaymentProviderTypeEnum = z.enum(['CARD', 'INVOICE', 'GENERIC']);
export const DeliveryProviderTypeEnum = z.enum(['PICKUP', 'SHIPPING', 'LOCAL']);
export const WarehousingProviderTypeEnum = z.enum(['PHYSICAL', 'VIRTUAL']);

export const ConfigurationEntry = z
  .object({
    key: z
      .string()
      .min(1)
      .describe('Configuration parameter name (e.g., "apiKey", "webhookUrl", "sandbox")'),
    value: z
      .any()
      .describe(
        'Configuration parameter value (string, number, boolean, or object depending on the setting)',
      ),
  })
  .strict();

export const ProviderConfigSchema = z.object({
  type: z
    .union([PaymentProviderTypeEnum, DeliveryProviderTypeEnum, WarehousingProviderTypeEnum])
    .describe(
      'Specific provider subtype: PAYMENT types (CARD, INVOICE, GENERIC), DELIVERY types (PICKUP, SHIPPING, LOCAL), WAREHOUSING types (PHYSICAL, VIRTUAL) - must match providerType category',
    ),
  adapterKey: z
    .string()
    .min(1)
    .describe(
      'Unique adapter key that identifies the specific provider implementation - get available keys from provider_interfaces tool',
    ),
});

export const actionValidators = {
  CREATE: z.object({
    providerType: ProviderTypeEnum.describe('Type of provider system to operate on'),
    provider: ProviderConfigSchema.describe('Provider configuration including type and adapter'),
  }),

  UPDATE: z.object({
    providerType: ProviderTypeEnum.describe('Type of provider system to operate on'),
    providerId: z.string().min(1).describe('Unique identifier of the specific provider instance'),
    configuration: z
      .array(ConfigurationEntry)
      .min(1)
      .describe(
        'Array of configuration key-value pairs to update - each provider adapter has different required/optional configuration parameters',
      )
      .refine(
        (data) => {
          const keys = data.map((entry) => entry.key);
          return new Set(keys).size === keys.length;
        },
        {
          message: 'Duplicate configuration keys are not allowed - each key must be unique.',
        },
      ),
  }),

  REMOVE: z.object({
    providerType: ProviderTypeEnum.describe('Type of provider system to operate on'),
    providerId: z.string().min(1).describe('Unique identifier of the specific provider instance'),
  }),

  GET: z.object({
    providerType: ProviderTypeEnum.describe('Type of provider system to operate on'),
    providerId: z.string().min(1).describe('Unique identifier of the specific provider instance'),
  }),

  LIST: z.object({
    providerType: ProviderTypeEnum.describe('Type of provider system to operate on'),
    typeFilter: z
      .union([PaymentProviderTypeEnum, DeliveryProviderTypeEnum, WarehousingProviderTypeEnum])
      .optional()
      .describe(
        'Optional filter by specific subtype: PAYMENT (CARD, INVOICE, GENERIC), DELIVERY (PICKUP, SHIPPING, LOCAL), WAREHOUSING (PHYSICAL, VIRTUAL)',
      ),
    queryString: z
      .string()
      .min(1)
      .optional()
      .describe(
        'Optional search term to filter providers by their ID or adapter key (case-insensitive partial match)',
      ),
  }),

  INTERFACES: z.object({
    providerType: ProviderTypeEnum.describe('Type of provider system to operate on'),
    typeFilter: z
      .union([PaymentProviderTypeEnum, DeliveryProviderTypeEnum, WarehousingProviderTypeEnum])
      .optional()
      .describe(
        'Optional filter by specific subtype: PAYMENT (CARD, INVOICE, GENERIC), DELIVERY (PICKUP, SHIPPING, LOCAL), WAREHOUSING (PHYSICAL, VIRTUAL)',
      ),
  }),
} as const;

export const ProviderManagementSchema = {
  action: z
    .enum(['CREATE', 'UPDATE', 'REMOVE', 'GET', 'LIST', 'INTERFACES'])
    .describe(
      'Provider action: CREATE (new provider), UPDATE (modify configuration), REMOVE (soft delete), GET (retrieve single), LIST (find multiple), INTERFACES (available adapters)',
    ),

  providerType: ProviderTypeEnum.describe('Type of provider system to operate on'),

  provider: ProviderConfigSchema.optional().describe(
    'Provider configuration including type and adapter (required for CREATE action)',
  ),

  providerId: z
    .string()
    .min(1)
    .optional()
    .describe(
      'Unique identifier of the specific provider instance (required for UPDATE, REMOVE, GET actions)',
    ),

  configuration: z
    .array(ConfigurationEntry)
    .min(1)
    .optional()
    .describe(
      'Array of configuration key-value pairs to update (required for UPDATE action) - each provider adapter has different required/optional configuration parameters',
    )
    .refine(
      (data) => {
        if (!data) return true;
        const keys = data.map((entry) => entry.key);
        return new Set(keys).size === keys.length;
      },
      {
        message: 'Duplicate configuration keys are not allowed - each key must be unique.',
        path: ['configuration'],
      },
    ),

  typeFilter: z
    .union([PaymentProviderTypeEnum, DeliveryProviderTypeEnum, WarehousingProviderTypeEnum])
    .optional()
    .describe(
      'Optional filter by specific subtype for LIST/INTERFACES action: PAYMENT (CARD, INVOICE, GENERIC), DELIVERY (PICKUP, SHIPPING, LOCAL), WAREHOUSING (PHYSICAL, VIRTUAL)',
    ),

  queryString: z
    .string()
    .min(1)
    .optional()
    .describe(
      'Optional search term for LIST action to filter providers by their ID or adapter key (case-insensitive partial match)',
    ),
};

export const ProviderManagementZodSchema = z.object(ProviderManagementSchema);
export type ProviderManagementParams = z.infer<typeof ProviderManagementZodSchema>;

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (providerModule: any, params: Params<T>) => Promise<unknown>;
