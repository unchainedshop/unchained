import { z } from 'zod';
import { Context } from '../../../context.js';
import { log } from '@unchainedshop/logger';
import { PaymentDirector, DeliveryDirector, WarehousingDirector } from '@unchainedshop/core';
import {
  ProviderConfigurationInvalid,
  PaymentProviderNotFoundError,
  DeliverProviderNotFoundError,
  WarehousingProviderNotFoundError,
} from '../../../errors.js';

const ProviderTypeEnum = z.enum(['PAYMENT', 'DELIVERY', 'WAREHOUSING'], {
  description:
    'Type of provider - PAYMENT for payment processing (cards, invoices), DELIVERY for shipping/pickup methods, WAREHOUSING for inventory management',
});

const PaymentProviderTypeEnum = z.enum(['CARD', 'INVOICE', 'GENERIC']);
const DeliveryProviderTypeEnum = z.enum(['PICKUP', 'SHIPPING', 'LOCAL']);
const WarehousingProviderTypeEnum = z.enum(['PHYSICAL', 'VIRTUAL']);

const ConfigurationEntry = z.object({
  key: z
    .string()
    .min(1)
    .describe('Configuration parameter name (e.g., "apiKey", "webhookUrl", "sandbox")'),
  value: z
    .any()
    .describe(
      'Configuration parameter value (string, number, boolean, or object depending on the setting)',
    ),
});

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

interface ProviderModuleConfig {
  module: any;
  director: any;
  NotFoundError: any;
  idField: string;
}

function getProviderConfig(context: Context, providerType: string): ProviderModuleConfig {
  switch (providerType) {
    case 'PAYMENT':
      return {
        module: context.modules.payment.paymentProviders,
        director: PaymentDirector,
        NotFoundError: PaymentProviderNotFoundError,
        idField: 'paymentProviderId',
      };
    case 'DELIVERY':
      return {
        module: context.modules.delivery,
        director: DeliveryDirector,
        NotFoundError: DeliverProviderNotFoundError,
        idField: 'deliveryProviderId',
      };
    case 'WAREHOUSING':
      return {
        module: context.modules.warehousing,
        director: WarehousingDirector,
        NotFoundError: WarehousingProviderNotFoundError,
        idField: 'warehousingProviderId',
      };
    default:
      throw new Error(`Unknown provider type: ${providerType}`);
  }
}

export async function providerManagement(context: Context, params: ProviderManagementParams) {
  const { action, providerType } = params;
  const { userId } = context;

  try {
    log('handler providerManagement', { userId, action, providerType, params });

    const config = getProviderConfig(context, providerType);

    switch (action) {
      case 'CREATE': {
        const { provider } = params;
        if (!provider) {
          throw new Error('Provider configuration is required for CREATE action');
        }

        const Adapter = config.director.getAdapter(provider.adapterKey);
        if (!Adapter) throw new ProviderConfigurationInvalid(provider);

        const created = await config.module.create({
          configuration: Adapter.initialConfiguration,
          ...provider,
        } as any);

        if (!created) throw new ProviderConfigurationInvalid(provider);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                providerType,
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

        const existsParam = { [config.idField]: providerId };

        if (providerType === 'PAYMENT') {
          if (!(await config.module.providerExists(existsParam))) {
            throw new config.NotFoundError(existsParam);
          }
        } else {
          const existing = await config.module.findProvider(existsParam);
          if (!existing) throw new config.NotFoundError(existsParam);
        }

        const updated = await config.module.update(providerId, { configuration } as any);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                providerType,
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

        const existing = await config.module.findProvider({ [config.idField]: providerId });
        if (!existing) throw new config.NotFoundError({ [config.idField]: providerId });

        await config.module.delete(providerId);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                providerType,
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

        const provider = await config.module.findProvider({ [config.idField]: providerId });

        if (!provider) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  providerType,
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
                providerType,
                action,
                data: { provider },
              }),
            },
          ],
        };
      }

      case 'LIST': {
        const { typeFilter, queryString } = params;

        const selector: Record<string, any> = {};
        if (typeFilter) selector.type = typeFilter;

        if (queryString) {
          const regex = new RegExp(queryString, 'i');
          selector.$or = [{ _id: regex }, { adapterKey: regex }];
        }

        const providers = await config.module.findProviders(selector);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                providerType,
                action,
                data: { providers },
              }),
            },
          ],
        };
      }

      case 'INTERFACES': {
        const { typeFilter } = params;

        let allAdapters = config.director.getAdapters();

        if (typeFilter) {
          allAdapters = allAdapters.filter((adapter: any) => adapter.typeSupported(typeFilter));
        }

        const interfaces = allAdapters.map((Adapter: any) => ({
          adapterKey: Adapter.key,
          label: Adapter.label,
          version: Adapter.version,
        }));

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                providerType,
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
