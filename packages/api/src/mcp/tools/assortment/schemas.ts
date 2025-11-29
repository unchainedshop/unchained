import { z } from 'zod';
import { SortDirection } from '@unchainedshop/utils';
import {
  PaginationSchema,
  SortingSchema,
  SearchSchema,
  LocalizationTextSchema,
} from '../../utils/sharedSchemas.js';

export const sortDirectionKeys = Object.keys(SortDirection) as [string, ...string[]];

export const AssortmentTextInputSchema = LocalizationTextSchema.extend({
  slug: z.string().optional().describe('URL slug'),
  description: z.string().optional().describe('Markdown description'),
}).describe('Assortment localized text data');

export const AssortmentMediaTextInputSchema = LocalizationTextSchema.describe(
  'Assortment media localized text data',
);

export const AssortmentSchema = z.object({
  isRoot: z.boolean().optional().describe('Whether this is a root-level assortment'),
  isActive: z.boolean().optional().describe('Whether this assortment is active'),
  tags: z.array(z.string().min(1).toLowerCase()).optional().describe('Tags (lowercased strings)'),
  sequence: z.number().int().optional().describe('Sorting sequence'),
  meta: z.record(z.any(), z.any()).optional().describe('Custom metadata as key-value pairs'),
});

export const actionValidators = {
  CREATE: z.object({
    assortment: AssortmentSchema.describe('Assortment data'),
    texts: z.array(AssortmentTextInputSchema).optional().describe('Localized assortment text entries'),
  }),

  UPDATE: z.object({
    assortmentId: z.string().min(1).describe('Assortment ID'),
    assortment: AssortmentSchema.describe('Assortment data to update'),
  }),

  REMOVE: z.object({
    assortmentId: z.string().min(1).describe('Assortment ID'),
  }),

  GET: z
    .object({
      assortmentId: z.string().min(1).optional().describe('Assortment ID'),
      slug: z.string().optional().describe('Assortment slug'),
    })
    .refine((data) => data.assortmentId || data.slug, {
      message: 'Either assortmentId or slug is required',
    }),

  LIST: z.object({
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
    tags: z.array(z.string().min(1).toLowerCase()).optional().describe('Filter by tags'),
    slugs: z.array(z.string().min(1)).optional().describe('Filter by assortment slugs'),
    includeLeaves: z.boolean().default(true).optional().describe('Include leaf-level assortments'),
  }),

  COUNT: z.object({
    ...SearchSchema,
    tags: z.array(z.string().min(1).toLowerCase()).optional().describe('Filter by tags'),
    slugs: z.array(z.string().min(1)).optional().describe('Filter by assortment slugs'),
    includeLeaves: z.boolean().optional().describe('Include leaf-level assortments'),
  }),

  UPDATE_STATUS: z.object({
    assortmentId: z.string().min(1).describe('Assortment ID'),
    statusAction: z.enum(['ACTIVATE', 'DEACTIVATE']).describe('Status action'),
  }),

  ADD_MEDIA: z.object({
    assortmentId: z.string().min(1).describe('Assortment ID'),
    mediaId: z.string().min(1).describe('Media ID'),
    tags: z.array(z.string().min(1).toLowerCase()).optional().describe('Tags for media association'),
  }),

  REMOVE_MEDIA: z.object({
    mediaId: z.string().min(1).describe('Media ID'),
  }),

  REORDER_MEDIA: z.object({
    sortKeys: z
      .array(
        z.object({
          assortmentMediaId: z.string().min(1).describe('Assortment Media asset ID'),
          sortKey: z.number().int().describe('New sort position'),
        }),
      )
      .nonempty()
      .describe('Sort keys'),
  }),

  GET_MEDIA: z.object({
    assortmentId: z.string().min(1).describe('Assortment ID'),
    tags: z.array(z.string().min(1).toLowerCase()).optional().describe('Filter by tags'),
    ...PaginationSchema,
  }),

  UPDATE_MEDIA_TEXTS: z.object({
    assortmentMediaId: z.string().min(1).describe('Assortment media ID'),
    mediaTexts: z.array(AssortmentMediaTextInputSchema).describe('Media texts'),
  }),

  ADD_PRODUCT: z.object({
    assortmentId: z.string().min(1).describe('Assortment ID'),
    productId: z.string().min(1).describe('Product ID'),
    tags: z.array(z.string().min(1).toLowerCase()).optional().describe('Tags for product association'),
  }),

  REMOVE_PRODUCT: z.object({
    assortmentProductId: z
      .string()
      .min(1)
      .describe(
        'Assortment Product ID (from assortment product relationship, _id of assortment product)',
      ),
  }),

  GET_PRODUCTS: z.object({
    assortmentId: z.string().min(1).describe('Assortment ID'),
  }),

  REORDER_PRODUCTS: z.object({
    sortKeys: z
      .array(
        z.object({
          assortmentProductId: z
            .string()
            .min(1)
            .describe(
              'Assortment product ID,(from assortment product relationship, _id of assortment product)',
            ),
          sortKey: z.number().int().describe('New sort position'),
        }),
      )
      .nonempty()
      .describe('Sort keys'),
  }),

  ADD_FILTER: z.object({
    assortmentId: z.string().min(1).describe('Assortment ID'),
    filterId: z.string().min(1).describe('Filter ID'),
    tags: z.array(z.string().min(1).toLowerCase()).optional().describe('Tags for filter association'),
  }),

  REMOVE_FILTER: z.object({
    assortmentFilterId: z
      .string()
      .min(1)
      .describe('Assortment Filter ID (from assortment filter relationship)'),
  }),

  GET_FILTERS: z.object({
    assortmentId: z.string().min(1).describe('Assortment ID'),
  }),

  REORDER_FILTERS: z.object({
    sortKeys: z
      .array(
        z.object({
          assortmentFilterId: z
            .string()
            .min(1)
            .describe('Assortment filter ID (from assortment filter relationship)'),
          sortKey: z.number().int().describe('New sort position'),
        }),
      )
      .nonempty()
      .describe('Sort keys'),
  }),

  ADD_LINK: z.object({
    parentAssortmentId: z.string().min(1).describe('Parent assortment ID'),
    childAssortmentId: z.string().min(1).describe('Child assortment ID'),
    tags: z.array(z.string().min(1).toLowerCase()).optional().describe('Tags for link association'),
  }),

  REMOVE_LINK: z.object({
    assortmentLinkId: z.string().min(1).describe('Assortment link ID'),
  }),

  GET_LINKS: z.object({
    assortmentId: z.string().min(1).describe('Assortment ID'),
  }),

  REORDER_LINKS: z.object({
    sortKeys: z
      .array(
        z.object({
          assortmentLinkId: z.string().min(1).describe('Assortment link ID'),
          sortKey: z.number().int().describe('New sort position'),
        }),
      )
      .nonempty()
      .describe('Sort keys'),
  }),

  GET_CHILDREN: z.object({
    assortmentId: z.string().min(1).describe('Assortment ID (optional for root-level)'),
    includeInactive: z.boolean().optional().describe('Include inactive children'),
  }),

  SET_BASE: z.object({
    assortmentId: z.string().min(1).describe('Assortment ID to set as base'),
  }),

  SEARCH_PRODUCTS: z.object({
    assortmentId: z.string().min(1).describe('Assortment ID'),
    ...PaginationSchema,
    ...SearchSchema,
  }),

  GET_TEXTS: z.object({
    assortmentId: z.string().min(1).describe('Assortment ID'),
  }),

  GET_MEDIA_TEXTS: z.object({
    assortmentMediaId: z.string().min(1).describe('Assortment media ID'),
  }),
} as const;

export const AssortmentManagementSchema = {
  action: z
    .enum([
      'CREATE',
      'UPDATE',
      'REMOVE',
      'GET',
      'LIST',
      'COUNT',
      'UPDATE_STATUS',
      'ADD_MEDIA',
      'REMOVE_MEDIA',
      'REORDER_MEDIA',
      'GET_MEDIA',
      'UPDATE_MEDIA_TEXTS',
      'ADD_PRODUCT',
      'REMOVE_PRODUCT',
      'GET_PRODUCTS',
      'REORDER_PRODUCTS',
      'ADD_FILTER',
      'REMOVE_FILTER',
      'GET_FILTERS',
      'REORDER_FILTERS',
      'ADD_LINK',
      'REMOVE_LINK',
      'GET_LINKS',
      'REORDER_LINKS',
      'GET_CHILDREN',
      'SET_BASE',
      'SEARCH_PRODUCTS',
      'GET_TEXTS',
      'GET_MEDIA_TEXTS',
    ])
    .describe('Assortment management action to perform'),

  assortmentId: z
    .string()
    .min(1)
    .optional()
    .describe('Assortment ID (required for most actions except CREATE, LIST, COUNT)'),
  slug: z.string().optional().describe('Assortment slug (alternative to assortmentId for GET action)'),
  assortmentMediaId: z
    .string()
    .min(1)
    .optional()
    .describe('Assortment media ID (required for media-specific actions)'),

  assortment: AssortmentSchema.optional().describe('Assortment data object for CREATE/UPDATE actions'),
  texts: z
    .array(AssortmentTextInputSchema)
    .optional()
    .describe('Localized assortment text entries for CREATE action'),

  statusAction: z
    .enum(['ACTIVATE', 'DEACTIVATE'])
    .optional()
    .describe('Status action for UPDATE_STATUS action'),

  mediaId: z.string().min(1).optional().describe('Media ID for ADD_MEDIA action'),
  sortKeys: z
    .array(
      z.union([
        z.object({
          assortmentMediaId: z.string().min(1).describe('Media asset ID'),
          sortKey: z.number().int().describe('New sort position'),
        }),
        z.object({
          assortmentProductId: z.string().min(1).describe('_id of assortment product relationship ID'),
          sortKey: z.number().int().describe('New sort position'),
        }),
        z.object({
          assortmentFilterId: z.string().min(1).describe('Filter relationship ID'),
          sortKey: z.number().int().describe('New sort position'),
        }),
        z.object({
          assortmentLinkId: z.string().min(1).describe('Link relationship ID'),
          sortKey: z.number().int().describe('New sort position'),
        }),
      ]),
    )
    .optional()
    .describe('Sort keys for REORDER actions'),
  mediaTexts: z
    .array(AssortmentMediaTextInputSchema)
    .optional()
    .describe('Media text updates for UPDATE_MEDIA_TEXTS action'),
  tags: z.array(z.string()).optional().describe('Tags filter or association tags'),
  assortmentProductId: z
    .string()
    .min(1)
    .optional()
    .describe('Product ID for REORDER_PRODUCTS/REMOVE_PRODUCT actions'),
  productId: z.string().min(1).optional().describe('Product ID for ADD_PRODUCT/REMOVE_PRODUCT actions'),
  filterId: z.string().min(1).optional().describe('Filter ID for ADD_FILTER/REMOVE_FILTER actions'),
  assortmentFilterId: z
    .string()
    .min(1)
    .optional()
    .describe('Filter ID for REORDER_FILTERS/REMOVE_FILTER actions'),
  parentAssortmentId: z.string().min(1).optional().describe('Parent assortment ID for ADD_LINK action'),
  childAssortmentId: z.string().min(1).optional().describe('Child assortment ID for ADD_LINK action'),
  assortmentLinkId: z.string().min(1).optional().describe('Link ID for REMOVE_LINK action'),

  ...PaginationSchema,
  ...SortingSchema,
  ...SearchSchema,
  includeLeaves: z.boolean().optional().describe('Include leaf-level assortments in results'),
  slugs: z.array(z.string()).optional().describe('Filter by specific slugs'),
};

export const AssortmentManagementZodSchema = z.object(AssortmentManagementSchema);
export type AssortmentManagementParams = z.infer<typeof AssortmentManagementZodSchema>;

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (
  assortmentModule: any,
  params: Params<T>,
) => Promise<unknown>;
