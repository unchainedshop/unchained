import { z } from 'zod/v4-mini';
import { SortDirection } from '@unchainedshop/utils';
import {
  PaginationSchema,
  SortingSchema,
  SearchSchema,
  LocalizationTextSchema,
  createManagementSchemaFromValidators,
} from '../../utils/sharedSchemas.ts';

export const sortDirectionKeys = Object.keys(SortDirection) as [string, ...string[]];

export const AssortmentTextInputSchema = z
  .extend(LocalizationTextSchema, {
    slug: z.optional(z.string()).check(z.describe('URL slug')),
    description: z.optional(z.string()).check(z.describe('Markdown description')),
  })
  .check(z.describe('Assortment localized text data'));

export const AssortmentMediaTextInputSchema = LocalizationTextSchema.check(
  z.describe('Assortment media localized text data'),
);

export const AssortmentSchema = z.object({
  isRoot: z.optional(z.boolean()).check(z.describe('Whether this is a root-level assortment')),
  isActive: z.optional(z.boolean()).check(z.describe('Whether this assortment is active')),
  tags: z
    .optional(z.array(z.string().check(z.minLength(1), z.toLowerCase())))
    .check(z.describe('Tags (lowercased strings)')),
  sequence: z.optional(z.int()).check(z.describe('Sorting sequence')),
  meta: z.optional(z.record(z.any(), z.any())).check(z.describe('Custom metadata as key-value pairs')),
});

export const actionValidators = {
  CREATE: z.object({
    assortment: AssortmentSchema.check(z.describe('Assortment data')),
    texts: z
      .optional(z.array(AssortmentTextInputSchema))
      .check(z.describe('Localized assortment text entries')),
  }),

  UPDATE: z.object({
    assortmentId: z.string().check(z.minLength(1), z.describe('Assortment ID')),
    assortment: AssortmentSchema.check(z.describe('Assortment data to update')),
  }),

  REMOVE: z.object({
    assortmentId: z.string().check(z.minLength(1), z.describe('Assortment ID')),
  }),

  GET: z
    .object({
      assortmentId: z.optional(z.string().check(z.minLength(1))).check(z.describe('Assortment ID')),
      slug: z.optional(z.string()).check(z.describe('Assortment slug')),
    })
    .check(
      z.refine((data) => data.assortmentId || data.slug, {
        message: 'Either assortmentId or slug is required',
      }),
    ),

  LIST: z.object({
    ...PaginationSchema,
    ...SortingSchema,
    ...SearchSchema,
    tags: z
      .optional(z.array(z.string().check(z.minLength(1), z.toLowerCase())))
      .check(z.describe('Filter by tags')),
    slugs: z
      .optional(z.array(z.string().check(z.minLength(1))))
      .check(z.describe('Filter by assortment slugs')),
    includeLeaves: z._default(z.boolean(), true).check(z.describe('Include leaf-level assortments')),
  }),

  COUNT: z.object({
    ...SearchSchema,
    tags: z
      .optional(z.array(z.string().check(z.minLength(1), z.toLowerCase())))
      .check(z.describe('Filter by tags')),
    slugs: z
      .optional(z.array(z.string().check(z.minLength(1))))
      .check(z.describe('Filter by assortment slugs')),
    includeLeaves: z.optional(z.boolean()).check(z.describe('Include leaf-level assortments')),
  }),

  UPDATE_STATUS: z.object({
    assortmentId: z.string().check(z.minLength(1), z.describe('Assortment ID')),
    statusAction: z.enum(['ACTIVATE', 'DEACTIVATE']).check(z.describe('Status action')),
  }),

  ADD_MEDIA: z.object({
    assortmentId: z.string().check(z.minLength(1), z.describe('Assortment ID')),
    mediaId: z.string().check(z.minLength(1), z.describe('Media ID')),
    tags: z
      .optional(z.array(z.string().check(z.minLength(1), z.toLowerCase())))
      .check(z.describe('Tags for media association')),
  }),

  REMOVE_MEDIA: z.object({
    mediaId: z.string().check(z.minLength(1), z.describe('Media ID')),
  }),

  REORDER_MEDIA: z.object({
    sortKeys: z
      .array(
        z.object({
          assortmentMediaId: z.string().check(z.minLength(1), z.describe('Assortment Media asset ID')),
          sortKey: z.int().check(z.describe('New sort position')),
        }),
      )
      .check(z.minLength(1), z.describe('Sort keys')),
  }),

  GET_MEDIA: z.object({
    assortmentId: z.string().check(z.minLength(1), z.describe('Assortment ID')),
    tags: z
      .optional(z.array(z.string().check(z.minLength(1), z.toLowerCase())))
      .check(z.describe('Filter by tags')),
    ...PaginationSchema,
  }),

  UPDATE_MEDIA_TEXTS: z.object({
    assortmentMediaId: z.string().check(z.minLength(1), z.describe('Assortment media ID')),
    mediaTexts: z.array(AssortmentMediaTextInputSchema).check(z.describe('Media texts')),
  }),

  ADD_PRODUCT: z.object({
    assortmentId: z.string().check(z.minLength(1), z.describe('Assortment ID')),
    productId: z.string().check(z.minLength(1), z.describe('Product ID')),
    tags: z
      .optional(z.array(z.string().check(z.minLength(1), z.toLowerCase())))
      .check(z.describe('Tags for product association')),
  }),

  REMOVE_PRODUCT: z.object({
    assortmentProductId: z
      .string()
      .check(
        z.minLength(1),
        z.describe(
          'Assortment Product ID (from assortment product relationship, _id of assortment product)',
        ),
      ),
  }),

  GET_PRODUCTS: z.object({
    assortmentId: z.string().check(z.minLength(1), z.describe('Assortment ID')),
  }),

  REORDER_PRODUCTS: z.object({
    sortKeys: z
      .array(
        z.object({
          assortmentProductId: z
            .string()
            .check(
              z.minLength(1),
              z.describe(
                'Assortment product ID,(from assortment product relationship, _id of assortment product)',
              ),
            ),
          sortKey: z.int().check(z.describe('New sort position')),
        }),
      )
      .check(z.minLength(1), z.describe('Sort keys')),
  }),

  ADD_FILTER: z.object({
    assortmentId: z.string().check(z.minLength(1), z.describe('Assortment ID')),
    filterId: z.string().check(z.minLength(1), z.describe('Filter ID')),
    tags: z
      .optional(z.array(z.string().check(z.minLength(1), z.toLowerCase())))
      .check(z.describe('Tags for filter association')),
  }),

  REMOVE_FILTER: z.object({
    assortmentFilterId: z
      .string()
      .check(z.minLength(1), z.describe('Assortment Filter ID (from assortment filter relationship)')),
  }),

  GET_FILTERS: z.object({
    assortmentId: z.string().check(z.minLength(1), z.describe('Assortment ID')),
  }),

  REORDER_FILTERS: z.object({
    sortKeys: z
      .array(
        z.object({
          assortmentFilterId: z
            .string()
            .check(
              z.minLength(1),
              z.describe('Assortment filter ID (from assortment filter relationship)'),
            ),
          sortKey: z.int().check(z.describe('New sort position')),
        }),
      )
      .check(z.minLength(1), z.describe('Sort keys')),
  }),

  ADD_LINK: z.object({
    parentAssortmentId: z.string().check(z.minLength(1), z.describe('Parent assortment ID')),
    childAssortmentId: z.string().check(z.minLength(1), z.describe('Child assortment ID')),
    tags: z
      .optional(z.array(z.string().check(z.minLength(1), z.toLowerCase())))
      .check(z.describe('Tags for link association')),
  }),

  REMOVE_LINK: z.object({
    assortmentLinkId: z.string().check(z.minLength(1), z.describe('Assortment link ID')),
  }),

  GET_LINKS: z.object({
    assortmentId: z.string().check(z.minLength(1), z.describe('Assortment ID')),
  }),

  REORDER_LINKS: z.object({
    sortKeys: z
      .array(
        z.object({
          assortmentLinkId: z.string().check(z.minLength(1), z.describe('Assortment link ID')),
          sortKey: z.int().check(z.describe('New sort position')),
        }),
      )
      .check(z.minLength(1), z.describe('Sort keys')),
  }),

  GET_CHILDREN: z.object({
    assortmentId: z
      .string()
      .check(z.minLength(1), z.describe('Assortment ID (optional for root-level)')),
    includeInactive: z.optional(z.boolean()).check(z.describe('Include inactive children')),
  }),

  SEARCH_PRODUCTS: z.object({
    assortmentId: z.string().check(z.minLength(1), z.describe('Assortment ID')),
    ...PaginationSchema,
    ...SearchSchema,
  }),

  GET_TEXTS: z.object({
    assortmentId: z.string().check(z.minLength(1), z.describe('Assortment ID')),
  }),

  GET_MEDIA_TEXTS: z.object({
    assortmentMediaId: z.string().check(z.minLength(1), z.describe('Assortment media ID')),
  }),
} as const;

export const AssortmentManagementSchema = createManagementSchemaFromValidators(actionValidators);

export type { ManagementParams as AssortmentManagementParams } from '../../utils/sharedSchemas.ts';

export type ActionName = keyof typeof actionValidators;
export type Params<T extends ActionName> = z.infer<(typeof actionValidators)[T]>;
export type Handler<T extends ActionName> = (
  assortmentModule: any,
  params: Params<T>,
) => Promise<unknown>;
