import { z } from 'zod';
import { Context } from '../../../context.js';
import { SortDirection } from '@unchainedshop/utils';
import {
  configureLocalizationMcpModule,
  LocalizationType,
} from '../../modules/configureLocalizationMcpModule.js';
import { log } from '@unchainedshop/logger';

const LocalizationTypeEnum = z.enum(['COUNTRY', 'CURRENCY', 'LANGUAGE'], {
  description:
    'Type of localization entity - COUNTRY for geographic regions (US, DE, CH), CURRENCY for monetary units (USD, EUR, CHF), LANGUAGE for locale support (en, de, fr)',
});

const sortDirectionKeys = Object.keys(SortDirection) as [
  keyof typeof SortDirection,
  ...(keyof typeof SortDirection)[],
];

export const LocalizationManagementSchema = {
  action: z
    .enum(['CREATE', 'UPDATE', 'REMOVE', 'GET', 'LIST', 'COUNT'])
    .describe(
      'Localization action: CREATE (new entity), UPDATE (modify existing), REMOVE (soft delete), GET (retrieve single), LIST (find multiple with pagination), COUNT (get totals for analytics)',
    ),

  localizationType: LocalizationTypeEnum.describe('Type of localization system to operate on'),
  entity: z
    .object({
      isoCode: z
        .string()
        .min(1)
        .optional()
        .describe(
          'ISO identifier: Countries need 2-letter codes (US, DE), Currencies need 3-letter codes (USD, EUR), Languages accept 2-10 characters (en, de-CH)',
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
    })
    .optional()
    .describe('Entity configuration data (required for CREATE, optional for UPDATE)'),
  entityId: z
    .string()
    .min(1)
    .optional()
    .describe('Database ID of the specific entity instance (required for UPDATE, REMOVE, GET actions)'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe('Maximum number of results per page for LIST action (1-100, defaults to 50)'),

  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Number of records to skip for LIST action pagination - use (pageNumber - 1) * limit'),
  includeInactive: z
    .boolean()
    .optional()
    .describe(
      'Include disabled/inactive entities in results for LIST/COUNT actions - set to true to see all entities regardless of status',
    ),

  queryString: z
    .string()
    .min(1)
    .optional()
    .describe(
      'Search filter for entity names or ISO codes for LIST/COUNT actions (case-insensitive partial match) - e.g., "United" matches "United States", "US" matches country code',
    ),
  sort: z
    .array(
      z
        .object({
          key: z
            .string()
            .min(1)
            .describe(
              'Database field name for sorting (common: "isoCode", "name", "created", "updated")',
            ),
          value: z
            .enum(sortDirectionKeys)
            .describe(
              'Sort direction: "ASC" for ascending (A-Z, 0-9), "DESC" for descending (Z-A, 9-0)',
            ),
        })
        .strict(),
    )
    .optional()
    .describe('Custom sorting rules for LIST action - if not provided, uses default system ordering'),
};

export const LocalizationManagementZodSchema = z.object(LocalizationManagementSchema);
export type LocalizationManagementParams = z.infer<typeof LocalizationManagementZodSchema>;

export async function localizationManagement(context: Context, params: LocalizationManagementParams) {
  const { action, localizationType } = params;
  log('MCP localizationManagement', { userId: context.userId, params });
  try {
    const localizationModule = configureLocalizationMcpModule(context);

    switch (action) {
      case 'CREATE': {
        const { entity } = params;
        if (!entity || !entity.isoCode) {
          throw new Error('Entity with isoCode is required for CREATE action');
        }

        const newEntity = await localizationModule.create(
          localizationType as LocalizationType,
          entity as { isoCode: string; contractAddress?: string; decimals?: number },
        );
        const entityName = localizationModule.getEntityName(localizationType as LocalizationType);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                localizationType,
                data: { [entityName]: newEntity },
              }),
            },
          ],
        };
      }

      case 'UPDATE': {
        const { entityId, entity } = params;
        if (!entityId) {
          throw new Error('Entity ID is required for UPDATE action');
        }
        if (!entity) {
          throw new Error('Entity data is required for UPDATE action');
        }

        const updatedEntity = await localizationModule.update(
          localizationType as LocalizationType,
          entityId,
          entity,
        );
        const entityName = localizationModule.getEntityName(localizationType as LocalizationType);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                localizationType,
                data: { [entityName]: updatedEntity },
              }),
            },
          ],
        };
      }

      case 'REMOVE': {
        const { entityId } = params;
        if (!entityId) {
          throw new Error('Entity ID is required for REMOVE action');
        }

        const existing = await localizationModule.remove(localizationType as LocalizationType, entityId);
        const entityName = localizationModule.getEntityName(localizationType as LocalizationType);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                localizationType,
                data: { [entityName]: existing, localizationType },
              }),
            },
          ],
        };
      }

      case 'GET': {
        const { entityId } = params;
        if (!entityId) {
          throw new Error('Entity ID is required for GET action');
        }

        const entity = await localizationModule.get(localizationType as LocalizationType, entityId);
        const entityName = localizationModule.getEntityName(localizationType as LocalizationType);

        if (!entity) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  action,
                  localizationType,
                  data: { [entityName]: null },
                  message: `${localizationType} not found for ID: ${entityId}`,
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
                localizationType,
                data: { [entityName]: entity, localizationType },
              }),
            },
          ],
        };
      }

      case 'LIST': {
        const { limit, offset, includeInactive, queryString, sort } = params;

        const sortOptions =
          sort?.filter((s): s is { key: string; value: 'ASC' | 'DESC' } => Boolean(s.key && s.value)) ||
          undefined;

        const entities = await localizationModule.list(localizationType as LocalizationType, {
          limit,
          offset,
          includeInactive,
          queryString,
          sort: sortOptions,
        });

        const pluralEntityName = localizationModule.getPluralEntityName(
          localizationType as LocalizationType,
        );

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                localizationType,
                data: { [pluralEntityName]: entities, localizationType },
              }),
            },
          ],
        };
      }

      case 'COUNT': {
        const { includeInactive, queryString } = params;

        const count = await localizationModule.count(localizationType as LocalizationType, {
          includeInactive,
          queryString,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                action,
                localizationType,
                data: { count, type: localizationType },
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
          text: `Error in localization ${action.toLowerCase()}: ${(error as Error).message}`,
        },
      ],
    };
  }
}
