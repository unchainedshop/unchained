import { z } from 'zod';
import { Context } from '../../../context.js';
import { configureProviderMcpModule, ProviderType } from '../../modules/configureProviderMcpModule.js';
import { log } from '@unchainedshop/logger';

const ProviderTypeEnum = z.enum(['PAYMENT', 'DELIVERY', 'WAREHOUSING'], {
  description:
    'Type of provider - PAYMENT for payment processing (cards, invoices), DELIVERY for shipping/pickup methods, WAREHOUSING for inventory management',
});

const PaymentProviderTypeEnum = z.enum(['CARD', 'INVOICE', 'GENERIC']);
const DeliveryProviderTypeEnum = z.enum(['PICKUP', 'SHIPPING', 'LOCAL']);
const WarehousingProviderTypeEnum = z.enum(['PHYSICAL', 'VIRTUAL']);

const ConfigurationEntry = z
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

export const ProviderManagementSchema = {
  action: z
    .enum(['CREATE', 'UPDATE', 'REMOVE', 'GET', 'LIST', 'INTERFACES'])
    .describe(
      'Provider action: CREATE (new provider), UPDATE (modify configuration), REMOVE (soft delete), GET (retrieve single), LIST (find multiple), INTERFACES (available adapters)',
    ),

  providerType: ProviderTypeEnum.describe('Type of provider system to operate on'),

  provider: z
    .object({
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
    })
    .optional()
    .describe('Provider configuration including type and adapter (required for CREATE action)'),

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
      'Optional filter by specific subtype for LIST action: PAYMENT (CARD, INVOICE, GENERIC), DELIVERY (PICKUP, SHIPPING, LOCAL), WAREHOUSING (PHYSICAL, VIRTUAL)',
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

export async function providerManagement(context: Context, params: ProviderManagementParams) {
  const { action, providerType } = params;
  log('MCP localization create', { userId: context.userId, params });
  try {
    const providerModule = configureProviderMcpModule(context);

    switch (action) {
      case 'CREATE': {
        const { provider } = params;
        if (!provider || !provider.type || !provider.adapterKey) {
          throw new Error(
            'Provider configuration with type and adapterKey is required for CREATE action',
          );
        }

        const created = await providerModule.create(
          providerType as ProviderType,
          provider as { type: string; adapterKey: string },
        );

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: { provider: created },
              }),
            },
          ],
        };
      }

      case 'UPDATE': {
        const { providerId, configuration } = params;
        if (!providerId) {
          throw new Error('Provider ID is required for UPDATE action');
        }
        if (!configuration) {
          throw new Error('Configuration is required for UPDATE action');
        }

        const validConfiguration = configuration.filter((c): c is { key: string; value: any } =>
          Boolean(c.key && c.value !== undefined),
        );

        if (validConfiguration.length === 0) {
          throw new Error('At least one valid configuration entry with key and value is required');
        }

        const updated = await providerModule.update(providerType as ProviderType, providerId, {
          configuration: validConfiguration,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: { provider: updated },
              }),
            },
          ],
        };
      }

      case 'REMOVE': {
        const { providerId } = params;
        if (!providerId) {
          throw new Error('Provider ID is required for REMOVE action');
        }

        const existing = await providerModule.remove(providerType as ProviderType, providerId);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: { provider: existing },
              }),
            },
          ],
        };
      }

      case 'GET': {
        const { providerId } = params;
        if (!providerId) {
          throw new Error('Provider ID is required for GET action');
        }

        const provider = await providerModule.get(providerType as ProviderType, providerId);

        if (!provider) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  action,
                  data: { provider: null },
                  message: `${providerType.toLowerCase()} provider not found for ID: ${providerId}`,
                }),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: { provider },
              }),
            },
          ],
        };
      }

      case 'LIST': {
        const { typeFilter, queryString } = params;

        const providers = await providerModule.list(providerType as ProviderType, {
          typeFilter,
          queryString,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: { providers },
              }),
            },
          ],
        };
      }

      case 'INTERFACES': {
        const { typeFilter } = params;

        const interfaces = await providerModule.getInterfaces(providerType as ProviderType, typeFilter);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                data: {
                  interfaces,
                  providerType,
                  typeFilter: typeFilter || null,
                },
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
          text: `Error in provider ${action.toLowerCase()}: ${(error as Error).message}`,
        },
      ],
    };
  }
}
