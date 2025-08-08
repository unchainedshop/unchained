import { z } from 'zod';
import { Context } from '../../../context.js';
import { SortDirection } from '@unchainedshop/utils';
import { log } from '@unchainedshop/logger';
import { AssortmentNotFoundError } from '../../../errors.js';
import { getNormalizedAssortmentDetails } from '../../utils/getNormalizedAssortmentDetails.js';

const AssortmentActionEnum = z.enum(['CREATE', 'UPDATE', 'REMOVE', 'GET', 'LIST', 'COUNT'], {
  description:
    'CRUD operation to perform on assortments - CREATE for new assortments, UPDATE for modifications, REMOVE for deletion, GET for single retrieval, LIST for browsing, COUNT for totals',
});

const sortDirectionKeys = Object.keys(SortDirection) as [
  keyof typeof SortDirection,
  ...(keyof typeof SortDirection)[],
];

const AssortmentTextInputSchema = z.object({
  locale: z
    .string()
    .min(1)
    .describe('Locale ISO code (e.g., "en-US", "de-CH") - uses shop default if not provided'),
  slug: z.string().optional().describe('URL slug for this assortment'),
  title: z.string().optional().describe('Display title'),
  subtitle: z.string().optional().describe('Optional subtitle'),
  description: z.string().optional().describe('Optional description text'),
});

export const AssortmentCrudSchema = {
  action: AssortmentActionEnum.describe(
    'CRUD operation to perform - CREATE (requires assortment, optional texts), UPDATE (requires assortmentId + assortment), REMOVE (requires assortmentId), GET (requires assortmentId), LIST (uses pagination/filter params), COUNT (uses filter params)',
  ),

  assortment: z
    .object({
      isRoot: z.boolean().optional().describe('Whether this is a root-level assortment (CREATE/UPDATE)'),
      isActive: z.boolean().optional().describe('Whether this assortment is active (UPDATE only)'),
      tags: z
        .array(z.string().min(1).toLowerCase())
        .optional()
        .describe('Lowercase tags for categorization (CREATE/UPDATE)'),
      sequence: z
        .number()
        .int()
        .optional()
        .describe('Sort order - lower numbers have higher priority (UPDATE only)'),
    })
    .optional()
    .describe('Assortment data - required for CREATE, required for UPDATE'),

  texts: z
    .array(AssortmentTextInputSchema)
    .optional()
    .describe('Localized text content - optional for CREATE operations only'),

  assortmentId: z
    .string()
    .optional()
    .describe('Assortment ID - required for UPDATE/REMOVE/GET operations'),

  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(50)
    .describe('Maximum results per page for LIST operations (1-100, default: 50)'),
  offset: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe('Number of records to skip for LIST pagination (default: 0)'),
  includeInactive: z
    .boolean()
    .default(false)
    .describe('Include inactive assortments in LIST/COUNT results (default: false)'),
  includeLeaves: z
    .boolean()
    .default(false)
    .describe('Include leaf-level assortments in LIST/COUNT results (default: false)'),
  queryString: z
    .string()
    .min(1)
    .optional()
    .describe('Case-insensitive search filter for assortment names or tags (LIST/COUNT)'),
  sort: z
    .array(
      z.object({
        key: z
          .string()
          .min(1)
          .describe('Field to sort by - examples: "sequence", "created", "updated", "title"'),
        value: z
          .enum(sortDirectionKeys)
          .describe('Sort direction: ASC (ascending) or DESC (descending)'),
      }),
    )
    .optional()
    .describe('Custom sorting rules for LIST operations - multiple sort criteria supported'),
  slugs: z
    .array(z.string())
    .optional()
    .describe('Filter by specific URL slugs for LIST/COUNT operations'),
  tags: z.array(z.string()).optional().describe('Filter by specific tags for LIST/COUNT operations'),
};

export const AssortmentCrudZodSchema = z.object(AssortmentCrudSchema);
export type AssortmentCrudParams = z.infer<typeof AssortmentCrudZodSchema>;

export async function assortmentCrud(context: Context, params: AssortmentCrudParams) {
  const {
    action,
    assortment,
    texts,
    assortmentId,
    limit,
    offset,
    includeInactive,
    includeLeaves,
    queryString,
    sort,
    slugs,
    tags,
  } = params;
  const { modules, userId } = context;

  try {
    log('handler assortmentCrud', { userId, action, params });

    switch (action) {
      case 'CREATE': {
        if (!assortment) {
          throw new Error('assortment data is required for CREATE operations');
        }

        const newAssortment = await modules.assortments.create(assortment as any);

        if (texts) {
          await modules.assortments.texts.updateTexts(newAssortment._id, texts as any);
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                assortment: await getNormalizedAssortmentDetails(
                  { assortmentId: newAssortment._id },
                  context,
                ),
              }),
            },
          ],
        };
      }

      case 'UPDATE': {
        if (!assortmentId || !assortment) {
          throw new Error('assortmentId and assortment data are required for UPDATE operations');
        }

        if (!(await modules.assortments.assortmentExists({ assortmentId }))) {
          throw new AssortmentNotFoundError({ assortmentId });
        }

        await modules.assortments.update(assortmentId, assortment as any);
        const updatedAssortment = await getNormalizedAssortmentDetails({ assortmentId }, context);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ assortment: updatedAssortment }),
            },
          ],
        };
      }

      case 'REMOVE': {
        if (!assortmentId) {
          throw new Error('assortmentId is required for REMOVE operations');
        }

        const existing = await modules.assortments.findAssortment({ assortmentId });
        if (!existing) throw new AssortmentNotFoundError({ assortmentId });

        await modules.assortments.delete(assortmentId);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ assortment: existing }),
            },
          ],
        };
      }

      case 'GET': {
        if (!assortmentId) {
          throw new Error('assortmentId is required for GET operations');
        }

        const assortmentDetails = await getNormalizedAssortmentDetails({ assortmentId }, context);

        if (!assortmentDetails) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `Assortment not found for ID: ${assortmentId}`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ assortment: assortmentDetails }),
            },
          ],
        };
      }

      case 'LIST': {
        const assortments = await modules.assortments.findAssortments({
          limit,
          offset,
          includeInactive,
          includeLeaves,
          queryString,
          sort: sort as any[],
          slugs,
          tags,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ assortments }),
            },
          ],
        };
      }

      case 'COUNT': {
        const count = await modules.assortments.count({
          includeInactive,
          includeLeaves,
          queryString,
          slugs,
          tags,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                count,
                filters: { includeInactive, includeLeaves, queryString, slugs, tags },
              }),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error ${action.toLowerCase()}ing assortment: ${(error as Error).message}`,
        },
      ],
    };
  }
}
