/**
 * Products Module - Drizzle ORM with SQLite/Turso
 */

import { emit, registerEvents } from '@unchainedshop/events';
import {
  eq,
  and,
  or,
  inArray,
  sql,
  asc,
  desc,
  isNull,
  isNotNull,
  generateId,
  buildSelectColumns,
  type SQL,
  type DrizzleDb,
} from '@unchainedshop/store';
import { SortDirection, type SortOption, type Price } from '@unchainedshop/utils';
import {
  products,
  ProductStatus,
  ProductType,
  rowToProduct,
  type Product,
  type ProductRow,
  type ProductAssignment,
  type ProductBundleItem,
  type ProductConfiguration,
} from '../db/index.ts';
import { configureProductMediaModule } from './configureProductMediaModule.ts';
import { configureProductPricesModule } from './configureProductPrices.ts';
import { configureProductReviewsModule } from './configureProductReviewsModule.ts';
import { configureProductTextsModule } from './configureProductTextsModule.ts';
import { configureProductVariationsModule } from './configureProductVariationsModule.ts';
import { productsSettings, type ProductsSettingsOptions } from '../products-settings.ts';

// Re-export types for backwards compatibility
export { ProductStatus, ProductType };
export type { Product, ProductAssignment, ProductBundleItem, ProductConfiguration };

export interface ProductQuery {
  includeDrafts?: boolean;
  includeDeleted?: boolean;
  productIds?: string[];
  searchProductIds?: string[]; // ANDed with productIds for search filtering
  slugs?: string[];
  tags?: string[];
  skus?: string[];
  bundleItemProductIds?: string[];
  proxyAssignmentProductIds?: string[];
  // Used by filter plugins to filter products by key/value pairs
  filterQuery?: { key: string; value: unknown }[];
}

export interface ProductDiscount {
  _id: string;
  productId: string;
  code: string;
  total?: Price;
  discountKey: string;
  context?: any;
}

export type ProductFields = keyof Product;

export interface ProductQueryOptions {
  fields?: ProductColumnKeys[];
}

const COLUMNS = {
  _id: products._id,
  type: products.type,
  status: products.status,
  sequence: products.sequence,
  slugs: products.slugs,
  tags: products.tags,
  published: products.published,
  commerce: products.commerce,
  bundleItems: products.bundleItems,
  proxy: products.proxy,
  supply: products.supply,
  warehousing: products.warehousing,
  plan: products.plan,
  tokenization: products.tokenization,
  meta: products.meta,
  created: products.created,
  updated: products.updated,
  deleted: products.deleted,
} as const;

type ProductColumnKeys = keyof typeof COLUMNS;

const PRODUCT_EVENTS = [
  'PRODUCT_CREATE',
  'PRODUCT_REMOVE',
  'PRODUCT_SET_BASE',
  'PRODUCT_UPDATE',
  'PRODUCT_PUBLISH',
  'PRODUCT_UNPUBLISH',
  'PRODUCT_ADD_ASSIGNMENT',
  'PRODUCT_REMOVE_ASSIGNMENT',
  'PRODUCT_CREATE_BUNDLE_ITEM',
  'PRODUCT_REMOVE_BUNDLE_ITEM',
];

const InternalProductStatus = {
  DRAFT: null as string | null,
};

/**
 * Filter value types for JSON field queries.
 * Supports direct values, existence checks, exclusions, and set membership.
 */
export type JsonFilterValue =
  | string
  | number
  | boolean
  | null
  | { exists: boolean }
  | { notEqual: unknown }
  | { in: unknown[] }
  | { notIn: unknown[] };

/**
 * Build a SQL condition for querying JSON fields with typed filter values.
 * Replaces MongoDB-style operators with explicit typed alternatives.
 */
const buildJsonFieldCondition = (
  column:
    | typeof products.meta
    | typeof products.warehousing
    | typeof products.commerce
    | typeof products.supply,
  jsonPath: string,
  value: JsonFilterValue | unknown,
): SQL => {
  if (value === undefined) {
    // Undefined means field must exist
    return sql`json_extract(${column}, ${jsonPath}) IS NOT NULL`;
  }

  // Handle typed filter operators
  if (value && typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;

    // Existence check: { exists: true/false }
    if ('exists' in obj && typeof obj.exists === 'boolean') {
      return obj.exists
        ? sql`json_extract(${column}, ${jsonPath}) IS NOT NULL`
        : sql`json_extract(${column}, ${jsonPath}) IS NULL`;
    }

    // Not equal: { notEqual: value }
    if ('notEqual' in obj) {
      return sql`(json_extract(${column}, ${jsonPath}) IS NULL OR json_extract(${column}, ${jsonPath}) != ${obj.notEqual})`;
    }

    // In array: { in: [values] }
    if ('in' in obj && Array.isArray(obj.in)) {
      if (obj.in.length === 0) return sql`false`;
      const inConditions = obj.in.map((v) => sql`json_extract(${column}, ${jsonPath}) = ${v}`);
      return or(...inConditions) || sql`false`;
    }

    // Not in array: { notIn: [values] }
    if ('notIn' in obj && Array.isArray(obj.notIn)) {
      if (obj.notIn.length === 0) return sql`true`;
      const ninConditions = obj.notIn.map((v) => sql`json_extract(${column}, ${jsonPath}) != ${v}`);
      return and(...ninConditions) || sql`true`;
    }

    // Object value - stringify for comparison
    return sql`json_extract(${column}, ${jsonPath}) = ${JSON.stringify(value)}`;
  }

  // Primitive value - direct equality
  return sql`json_extract(${column}, ${jsonPath}) = ${value}`;
};

// Convenience wrappers for specific JSON columns
const buildMetaCondition = (jsonPath: string, value: JsonFilterValue | unknown) =>
  buildJsonFieldCondition(products.meta, jsonPath, value);
const buildWarehousingCondition = (jsonPath: string, value: JsonFilterValue | unknown) =>
  buildJsonFieldCondition(products.warehousing, jsonPath, value);
const buildCommerceCondition = (jsonPath: string, value: JsonFilterValue | unknown) =>
  buildJsonFieldCondition(products.commerce, jsonPath, value);
const buildSupplyCondition = (jsonPath: string, value: JsonFilterValue | unknown) =>
  buildJsonFieldCondition(products.supply, jsonPath, value);

export interface ProductsModuleInput {
  db: DrizzleDb;
  options?: ProductsSettingsOptions;
}

export const configureProductsModule = async ({
  db,
  options: productsOptions = {},
}: ProductsModuleInput) => {
  registerEvents(PRODUCT_EVENTS);
  await productsSettings.configureSettings(productsOptions);

  // Build filter conditions from query params
  const buildConditions = async (query: ProductQuery): Promise<SQL[]> => {
    const conditions: SQL[] = [];

    if (query.productIds?.length) {
      conditions.push(inArray(products._id, query.productIds));
    }

    if (query.searchProductIds?.length) {
      conditions.push(inArray(products._id, query.searchProductIds));
    }

    if (query.slugs?.length) {
      // Check if any slug matches in the JSON array
      const slugConditions = query.slugs.map(
        (slug) => sql`EXISTS (SELECT 1 FROM json_each(${products.slugs}) WHERE value = ${slug})`,
      );
      conditions.push(or(...slugConditions)!);
    }

    if (query.tags?.length) {
      // All tags must match (AND condition)
      for (const tag of query.tags) {
        conditions.push(sql`EXISTS (SELECT 1 FROM json_each(${products.tags}) WHERE value = ${tag})`);
      }
    }

    if (query.skus?.length) {
      // Check warehousing.sku in JSON
      const skuConditions = query.skus.map(
        (sku) => sql`json_extract(${products.warehousing}, '$.sku') = ${sku}`,
      );
      conditions.push(or(...skuConditions)!);
    }

    if (query.bundleItemProductIds?.length || query.proxyAssignmentProductIds?.length) {
      const orConditions: SQL[] = [];
      if (query.bundleItemProductIds?.length) {
        // Check bundleItems JSON array for matching productId
        for (const productId of query.bundleItemProductIds) {
          orConditions.push(
            sql`EXISTS (SELECT 1 FROM json_each(${products.bundleItems}) WHERE json_extract(value, '$.productId') = ${productId})`,
          );
        }
      }
      if (query.proxyAssignmentProductIds?.length) {
        // Check proxy.assignments JSON array for matching productId
        for (const productId of query.proxyAssignmentProductIds) {
          orConditions.push(
            sql`EXISTS (SELECT 1 FROM json_each(json_extract(${products.proxy}, '$.assignments')) WHERE json_extract(value, '$.productId') = ${productId})`,
          );
        }
      }
      if (orConditions.length) {
        conditions.push(or(...orConditions)!);
      }
    }

    // Filter query - used by filter plugins to filter products by key/value pairs
    // Keys map to product fields: 'tags', 'meta.*' properties, or JSON path in nested fields
    if (query.filterQuery?.length) {
      for (const { key, value } of query.filterQuery) {
        if (key === 'tags') {
          // Tags are stored as JSON array
          if (value === true || value === undefined) {
            // Has any tags
            conditions.push(sql`json_array_length(${products.tags}) > 0`);
          } else if (typeof value === 'string') {
            conditions.push(
              sql`EXISTS (SELECT 1 FROM json_each(${products.tags}) WHERE value = ${value})`,
            );
          } else if (value && typeof value === 'object') {
            const filterValue = value as { notEqual?: string };
            if ('notEqual' in filterValue && filterValue.notEqual) {
              // Exclude specific tag
              conditions.push(
                sql`NOT EXISTS (SELECT 1 FROM json_each(${products.tags}) WHERE value = ${filterValue.notEqual})`,
              );
            }
          }
        } else if (key.startsWith('meta.')) {
          // Meta field query - extract from JSON
          const metaKey = key.slice(5);
          const jsonPath = `$.${metaKey}`;
          conditions.push(buildMetaCondition(jsonPath, value));
        } else if (key.startsWith('warehousing.')) {
          // Warehousing field query - extract from JSON column
          const subKey = key.slice('warehousing.'.length);
          const jsonPath = `$.${subKey}`;
          conditions.push(buildWarehousingCondition(jsonPath, value));
        } else if (key.startsWith('commerce.')) {
          // Commerce field query - extract from JSON column
          const subKey = key.slice('commerce.'.length);
          const jsonPath = `$.${subKey}`;
          conditions.push(buildCommerceCondition(jsonPath, value));
        } else if (key.startsWith('supply.')) {
          // Supply field query - extract from JSON column
          const subKey = key.slice('supply.'.length);
          const jsonPath = `$.${subKey}`;
          conditions.push(buildSupplyCondition(jsonPath, value));
        } else {
          // Generic top-level field check - for custom product properties stored in meta
          const jsonPath = `$.${key}`;
          conditions.push(buildMetaCondition(jsonPath, value));
        }
      }
    }

    // Status filtering
    // includeDeleted: include ALL products regardless of status (no filter)
    // includeDrafts: include ACTIVE and drafts (null status)
    // default: only ACTIVE products
    if (query.includeDeleted) {
      // No status filter - include all products including drafts and deleted
    } else if (query.includeDrafts) {
      conditions.push(or(eq(products.status, ProductStatus.ACTIVE), isNull(products.status))!);
    } else {
      conditions.push(eq(products.status, ProductStatus.ACTIVE));
    }

    return conditions;
  };

  // Sortable columns mapping for type-safe sorting
  const SORTABLE_COLUMNS = {
    _id: products._id,
    sequence: products.sequence,
    status: products.status,
    type: products.type,
    published: products.published,
    created: products.created,
    updated: products.updated,
  } as const;

  // Build sort options with proper typing
  const buildSortOptions = (sortOptions: SortOption[]) => {
    return sortOptions.map(({ key, value }) => {
      const column = SORTABLE_COLUMNS[key as keyof typeof SORTABLE_COLUMNS];
      if (!column) return asc(products.sequence);
      return value === SortDirection.DESC ? desc(column) : asc(column);
    });
  };

  /*
   * Product sub entities
   */

  const productTexts = configureProductTextsModule({ db });
  const productMedia = configureProductMediaModule({ db });
  const productReviews = configureProductReviewsModule({ db });
  const productVariations = configureProductVariationsModule({ db });

  const deleteProductPermanently = async (
    { productId }: { productId: string },
    options?: { keepReviews: boolean },
  ): Promise<number> => {
    // First verify the product is deleted
    const [product] = await db
      .select()
      .from(products)
      .where(and(eq(products._id, productId), eq(products.status, ProductStatus.DELETED)))
      .limit(1);

    if (!product) return 0;

    await productMedia.deleteMediaFiles({ productId });
    await productTexts.deleteMany({ productId });
    await productVariations.deleteVariations({ productId });
    if (!options?.keepReviews) {
      await productReviews.deleteMany({ productId });
    }

    const result = await db.delete(products).where(eq(products._id, productId));

    return result.rowsAffected;
  };

  const publishProduct = async (product: Product): Promise<boolean> => {
    if (product.status === InternalProductStatus.DRAFT) {
      await db
        .update(products)
        .set({
          status: ProductStatus.ACTIVE,
          updated: new Date(),
          published: new Date(),
        })
        .where(eq(products._id, product._id));

      await emit('PRODUCT_PUBLISH', { product });

      return true;
    }

    return false;
  };

  const unpublishProduct = async (product: Product): Promise<boolean> => {
    if (product.status === ProductStatus.ACTIVE) {
      const result = await db
        .update(products)
        .set({
          status: null,
          updated: new Date(),
          published: null,
        })
        .where(eq(products._id, product._id));

      await emit('PRODUCT_UNPUBLISH', { product });

      return result.rowsAffected > 0;
    }

    return false;
  };

  const proxyProducts = async (
    product: Product,
    vectors: ProductConfiguration[] = [],
    { includeInactive = false }: { includeInactive?: boolean } = {},
  ): Promise<Product[]> => {
    const { proxy } = product;
    let filtered = [...(proxy?.assignments || [])];
    vectors.forEach(({ key, value }) => {
      filtered = filtered.filter((assignment) => {
        if (assignment.vector[key] === value) {
          return true;
        }
        return false;
      });
    });
    const productIds = filtered.map((filteredAssignment) => filteredAssignment.productId);

    if (productIds.length === 0) return [];

    const statusCondition = includeInactive
      ? or(eq(products.status, ProductStatus.ACTIVE), isNull(products.status))
      : eq(products.status, ProductStatus.ACTIVE);

    const rows = await db
      .select()
      .from(products)
      .where(and(inArray(products._id, productIds), statusCondition));
    return rows.map(rowToProduct);
  };

  /*
   * Product
   */

  return {
    // Queries
    findProduct: async (
      params:
        | {
            productId: string;
          }
        | {
            slug: string;
          }
        | {
            sku: string;
          },
    ): Promise<Product | null> => {
      if ('sku' in params) {
        const [row] = await db
          .select()
          .from(products)
          .where(sql`json_extract(${products.warehousing}, '$.sku') = ${params.sku}`)
          .orderBy(asc(products.sequence))
          .limit(1);
        return row ? rowToProduct(row) : null;
      }
      if ('slug' in params && params.slug != null) {
        const [row] = await db
          .select()
          .from(products)
          .where(sql`EXISTS (SELECT 1 FROM json_each(${products.slugs}) WHERE value = ${params.slug})`)
          .limit(1);
        return row ? rowToProduct(row) : null;
      }
      if ('productId' in params && params.productId != null) {
        const [row] = await db
          .select()
          .from(products)
          .where(eq(products._id, params.productId))
          .limit(1);
        return row ? rowToProduct(row) : null;
      }
      return null;
    },

    findProducts: async (
      {
        limit,
        offset,
        sort,
        ...query
      }: ProductQuery & {
        limit?: number;
        offset?: number;
        sort?: SortOption[];
      },
      options?: ProductQueryOptions,
    ): Promise<Product[]> => {
      const conditions = await buildConditions(query);
      const defaultSortOption: SortOption[] = [
        { key: 'sequence', value: SortDirection.ASC },
        { key: 'published', value: SortDirection.DESC },
        { key: '_id', value: SortDirection.DESC }, // Tertiary sort for deterministic ordering
      ];

      const selectColumns = buildSelectColumns(COLUMNS, options?.fields);
      let q = selectColumns ? db.select(selectColumns).from(products) : db.select().from(products);

      if (conditions.length) {
        q = q.where(and(...conditions)) as typeof q;
      }

      const sortBy = buildSortOptions(sort || defaultSortOption);
      q = q.orderBy(...sortBy) as typeof q;

      if (limit) {
        q = q.limit(limit) as typeof q;
      }
      if (offset) {
        q = q.offset(offset) as typeof q;
      }

      const rows = await q;
      return selectColumns
        ? (rows as unknown as Product[])
        : rows.map((r) => rowToProduct(r as ProductRow));
    },

    findProductIds: async (query: ProductQuery): Promise<string[]> => {
      const conditions = await buildConditions(query);
      let q = db.select({ _id: products._id }).from(products);
      if (conditions.length) {
        q = q.where(and(...conditions)) as typeof q;
      }
      const rows = await q;
      return rows.map((r) => r._id);
    },

    count: async (query: ProductQuery) => {
      const conditions = await buildConditions(query);
      let q = db.select({ count: sql<number>`count(*)` }).from(products);
      if (conditions.length) {
        q = q.where(and(...conditions)) as typeof q;
      }
      const [result] = await q;
      return result?.count || 0;
    },

    productExists: async ({ productId, slug }: { productId?: string; slug?: string }) => {
      const conditions: SQL[] = [];
      if (productId) {
        conditions.push(eq(products._id, productId));
      } else if (slug) {
        conditions.push(sql`EXISTS (SELECT 1 FROM json_each(${products.slugs}) WHERE value = ${slug})`);
      }
      conditions.push(or(eq(products.status, ProductStatus.ACTIVE), isNull(products.status))!);

      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(...conditions))
        .limit(1);

      return (result?.count || 0) > 0;
    },

    isActive: (product: Product) => {
      return product.status === ProductStatus.ACTIVE;
    },
    isDraft: (product: Product) => {
      return product.status === ProductStatus.DRAFT || product.status === InternalProductStatus.DRAFT;
    },
    normalizedStatus: (product: Product): (typeof ProductStatus)[keyof typeof ProductStatus] => {
      return product.status === null
        ? ProductStatus.DRAFT
        : (product.status as (typeof ProductStatus)[keyof typeof ProductStatus]);
    },

    proxyAssignments: async (
      product: Product,
      { includeInactive = false }: { includeInactive?: boolean } = {},
    ): Promise<{ assignment: ProductAssignment; product: Product }[]> => {
      const assignments = product.proxy?.assignments || [];
      const productIds = assignments.map(({ productId }) => productId);

      if (productIds.length === 0) return [];

      const statusCondition = includeInactive
        ? or(eq(products.status, ProductStatus.ACTIVE), isNull(products.status))
        : eq(products.status, ProductStatus.ACTIVE);

      const supportedProducts = await db
        .select({ _id: products._id })
        .from(products)
        .where(and(inArray(products._id, productIds), statusCondition));

      const supportedProductIds = supportedProducts.map(({ _id }) => _id);

      return assignments
        .filter(({ productId }) => supportedProductIds.includes(productId))
        .map((assignment) => ({
          assignment,
          product,
        }));
    },

    proxyProducts,

    resolveOrderableProduct: async (
      product: Product,
      { configuration }: { configuration?: ProductConfiguration[] },
    ): Promise<Product> => {
      const productId = product._id as string;

      if (product.type === ProductType.CONFIGURABLE_PRODUCT) {
        const variations = await productVariations.findProductVariations({
          productId,
        });
        const vectors = configuration?.filter(({ key: configurationKey }) => {
          const isKeyEqualsVariationKey = Boolean(
            variations.filter(({ key: variationKey }) => variationKey === configurationKey).length,
          );
          return isKeyEqualsVariationKey;
        });

        const variants = await proxyProducts(product, vectors, {
          includeInactive: false,
        });
        if (variants.length !== 1) {
          throw new Error(
            'There needs to be exactly one variant left when adding a ConfigurableProduct to the cart, configuration not distinct enough',
          );
        }

        const resolvedProduct = variants[0];
        return resolvedProduct;
      }
      return product;
    },

    prices: configureProductPricesModule({ proxyProducts, db }),

    // Mutations
    create: async ({
      type,
      sequence,
      ...productData
    }: {
      type: string;
      sequence?: number;
      _id?: string;
    } & Partial<Omit<Product, '_id' | 'type'>>): Promise<Product> => {
      if (productData._id) {
        await deleteProductPermanently(
          {
            productId: productData._id as string,
          },
          { keepReviews: true },
        );
      }

      const productId = productData._id || generateId();

      // Get sequence if not provided
      let seq = sequence;
      if (seq === undefined) {
        const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(products);
        seq = (countResult?.count || 0) + 10;
      }

      await db.insert(products).values({
        _id: productId,
        created: new Date(),
        type,
        sequence: seq,
        slugs: [],
        ...productData,
        status: productData.status || null, // DRAFT if not specified (null, undefined, or empty string)
      });

      const [productRow] = await db.select().from(products).where(eq(products._id, productId)).limit(1);
      const product = rowToProduct(productRow);

      await emit('PRODUCT_CREATE', { product });

      return product;
    },

    update: async (productId: string, doc: Partial<Product>): Promise<Product | null> => {
      await db
        .update(products)
        .set({
          updated: new Date(),
          ...doc,
        })
        .where(eq(products._id, productId));

      const [updatedRow] = await db.select().from(products).where(eq(products._id, productId)).limit(1);

      if (!updatedRow) return null;

      const updatedProduct = rowToProduct(updatedRow);
      await emit('PRODUCT_UPDATE', { productId, product: updatedProduct });

      return updatedProduct;
    },

    firstActiveProductProxy: async (productId: string): Promise<Product | null> => {
      const [row] = await db
        .select()
        .from(products)
        .where(
          sql`EXISTS (SELECT 1 FROM json_each(json_extract(${products.proxy}, '$.assignments')) WHERE json_extract(value, '$.productId') = ${productId})`,
        )
        .limit(1);
      return row ? rowToProduct(row) : null;
    },

    firstActiveProductBundle: async (productId: string): Promise<Product | null> => {
      const [row] = await db
        .select()
        .from(products)
        .where(
          sql`EXISTS (SELECT 1 FROM json_each(${products.bundleItems}) WHERE json_extract(value, '$.productId') = ${productId})`,
        )
        .limit(1);
      return row ? rowToProduct(row) : null;
    },

    delete: async (productId: string): Promise<Product | null> => {
      const result = await db
        .update(products)
        .set({
          status: ProductStatus.DELETED,
          updated: new Date(),
        })
        .where(eq(products._id, productId));

      if (result.rowsAffected === 0) return null;

      const [row] = await db.select().from(products).where(eq(products._id, productId)).limit(1);

      await emit('PRODUCT_REMOVE', { productId });
      return row ? rowToProduct(row) : null;
    },

    deleteProductPermanently,

    publish: publishProduct,
    unpublish: unpublishProduct,

    /*
     * Sub entities
     */

    assignments: {
      addProxyAssignment: async ({
        productId,
        proxyId,
        vectors,
      }: {
        productId: string;
        proxyId: string;
        vectors: ProductConfiguration[];
      }): Promise<boolean> => {
        const assignment: ProductAssignment = {
          vector: Object.fromEntries(vectors.map(({ key, value }) => [key, value])),
          productId,
        };

        // Get current product
        const [product] = await db.select().from(products).where(eq(products._id, proxyId)).limit(1);

        if (!product) return false;

        const currentAssignments = product.proxy?.assignments || [];

        // Check if assignment already exists
        const exists = currentAssignments.some(
          (a) => JSON.stringify(a.vector) === JSON.stringify(assignment.vector),
        );
        if (exists) return false;

        const newAssignments = [...currentAssignments, assignment];

        await db
          .update(products)
          .set({
            updated: new Date(),
            proxy: { assignments: newAssignments },
          })
          .where(eq(products._id, proxyId));

        await emit('PRODUCT_ADD_ASSIGNMENT', { productId, proxyId });
        return true;
      },

      removeAssignment: async (
        productId: string,
        { vectors }: { vectors: ProductConfiguration[] },
      ): Promise<number> => {
        const vector = Object.fromEntries(vectors.map(({ key, value }) => [key, value]));

        // Get current product
        const [product] = await db.select().from(products).where(eq(products._id, productId)).limit(1);

        if (!product) return 0;

        const currentAssignments = product.proxy?.assignments || [];
        const newAssignments = currentAssignments.filter(
          (a) => JSON.stringify(a.vector) !== JSON.stringify(vector),
        );

        if (newAssignments.length === currentAssignments.length) return 0;

        await db
          .update(products)
          .set({
            updated: new Date(),
            proxy: { assignments: newAssignments },
          })
          .where(eq(products._id, productId));

        await emit('PRODUCT_REMOVE_ASSIGNMENT', { productId, vectors });

        return vectors.length;
      },
    },

    bundleItems: {
      addBundleItem: async (productId: string, doc: ProductBundleItem): Promise<string> => {
        const [product] = await db.select().from(products).where(eq(products._id, productId)).limit(1);

        if (!product) return productId;

        const currentBundleItems = product.bundleItems || [];
        const newBundleItems = [...currentBundleItems, doc];

        await db
          .update(products)
          .set({
            updated: new Date(),
            bundleItems: newBundleItems,
          })
          .where(eq(products._id, productId));

        await emit('PRODUCT_CREATE_BUNDLE_ITEM', { productId });

        return productId;
      },

      removeBundleItem: async (productId: string, index: number) => {
        const [product] = await db.select().from(products).where(eq(products._id, productId)).limit(1);

        if (!product) return null;

        const bundleItems = [...(product.bundleItems || [])];
        const removedItems = bundleItems.splice(index, 1);
        const removedItem = removedItems.length === 1 ? removedItems[0] : null;

        if (removedItem) {
          await db
            .update(products)
            .set({
              updated: new Date(),
              bundleItems,
            })
            .where(eq(products._id, productId));
        }

        await emit('PRODUCT_REMOVE_BUNDLE_ITEM', {
          productId,
          item: removedItem,
        });

        return removedItem;
      },
    },

    removeAllAssignmentsAndBundleItems: async (productId: string): Promise<Product | null> => {
      await db
        .update(products)
        .set({
          updated: new Date(),
          proxy: null,
          bundleItems: null,
        })
        .where(eq(products._id, productId));

      const [row] = await db.select().from(products).where(eq(products._id, productId)).limit(1);

      return row ? rowToProduct(row) : null;
    },

    media: productMedia,
    reviews: productReviews,
    variations: productVariations,

    search: {
      buildActiveDraftStatusFilter: () => ({
        status: [ProductStatus.ACTIVE, InternalProductStatus.DRAFT],
      }),
      buildActiveStatusFilter: () => ({
        status: [ProductStatus.ACTIVE],
      }),
      countFilteredProducts: async ({
        productIds,
      }: {
        productIds: string[];
        productSelector?: any;
      }): Promise<number> => {
        if (productIds.length === 0) return 0;
        const [result] = await db
          .select({ count: sql<number>`count(*)` })
          .from(products)
          .where(inArray(products._id, productIds));
        return result?.count || 0;
      },
      findFilteredProducts: async ({
        limit,
        offset,
        productIds,
        sort,
      }: {
        limit?: number;
        offset?: number;
        productIds: string[];
        sort?: SortOption[];
      }): Promise<Product[]> => {
        if (productIds.length === 0) return [];

        let q = db.select().from(products).where(inArray(products._id, productIds));

        if (sort?.length) {
          for (const { key, value } of sort) {
            const column = COLUMNS[key as keyof typeof COLUMNS];
            if (column) {
              q = q.orderBy(value === SortDirection.DESC ? desc(column) : asc(column)) as typeof q;
            }
          }
        }

        if (limit) {
          q = q.limit(limit) as typeof q;
        }
        if (offset) {
          q = q.offset(offset) as typeof q;
        }

        const rows = await q;
        return rows.map(rowToProduct);
      },
    },

    texts: productTexts,
    existingTags: async (): Promise<string[]> => {
      // Get all distinct tags from non-deleted products
      const rows = await db
        .select({ tags: products.tags })
        .from(products)
        .where(
          and(
            isNotNull(products.tags),
            or(eq(products.status, ProductStatus.ACTIVE), isNull(products.status))!,
          ),
        );

      const allTags = new Set<string>();
      for (const row of rows) {
        if (row.tags) {
          for (const tag of row.tags) {
            if (tag) allTags.add(tag);
          }
        }
      }
      return Array.from(allTags).sort();
    },
  };
};

export type ProductsModule = Awaited<ReturnType<typeof configureProductsModule>>;
