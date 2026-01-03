import { SortDirection, type SortOption } from '@unchainedshop/utils';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  eq,
  and,
  or,
  inArray,
  isNull,
  sql,
  asc,
  desc,
  generateId,
  buildSelectColumns,
  type SQL,
  type DrizzleDb,
} from '@unchainedshop/store';
import { quotations, QuotationStatus, type QuotationRow } from '../db/schema.ts';
import { quotationsSettings, type QuotationsSettingsOptions } from '../quotations-settings.ts';

export interface QuotationProposal {
  price?: number;
  expires?: Date;
  meta?: any;
}

export interface QuotationItemConfiguration {
  quantity?: number;
  configuration: { key: string; value: string }[];
}

export interface QuotationLogEntry {
  date: Date;
  status: string;
  info: string;
}

export interface Quotation {
  _id: string;
  configuration?: { key: string; value: string }[];
  context?: any;
  countryCode?: string;
  currencyCode?: string;
  expires?: Date;
  fulfilled?: Date;
  meta?: any;
  price?: number;
  productId: string;
  quotationNumber?: string;
  rejected?: Date;
  status: string | null;
  userId: string;
  log: QuotationLogEntry[];
  created: Date;
  updated?: Date;
  deleted?: Date | null;
}

export interface QuotationQuery {
  userId?: string;
  quotationIds?: string[];
  searchQuotationIds?: string[];
}

export type QuotationFields = keyof Quotation;

export interface QuotationQueryOptions {
  fields?: QuotationFields[];
}

export interface QuotationData {
  configuration?: { key: string; value: string }[];
  countryCode?: string;
  productId: string;
  userId: string;
}

const QUOTATION_EVENTS: string[] = ['QUOTATION_REQUEST_CREATE', 'QUOTATION_REMOVE', 'QUOTATION_UPDATE'];

const rowToQuotation = (row: QuotationRow): Quotation => ({
  _id: row._id,
  userId: row.userId,
  productId: row.productId,
  countryCode: row.countryCode ?? undefined,
  currencyCode: row.currencyCode ?? undefined,
  quotationNumber: row.quotationNumber ?? undefined,
  status: row.status,
  price: row.price ?? undefined,
  expires: row.expires ?? undefined,
  fulfilled: row.fulfilled ?? undefined,
  rejected: row.rejected ?? undefined,
  configuration: row.configuration ?? undefined,
  context: row.context ?? undefined,
  meta: row.meta ?? undefined,
  log: (row.log ?? []).map((entry) => ({
    ...entry,
    date: new Date(entry.date),
  })),
  created: row.created,
  updated: row.updated ?? undefined,
  deleted: row.deleted ?? null,
});

const COLUMNS = {
  _id: quotations._id,
  userId: quotations.userId,
  productId: quotations.productId,
  countryCode: quotations.countryCode,
  currencyCode: quotations.currencyCode,
  quotationNumber: quotations.quotationNumber,
  status: quotations.status,
  price: quotations.price,
  expires: quotations.expires,
  fulfilled: quotations.fulfilled,
  rejected: quotations.rejected,
  configuration: quotations.configuration,
  context: quotations.context,
  meta: quotations.meta,
  log: quotations.log,
  created: quotations.created,
  updated: quotations.updated,
  deleted: quotations.deleted,
} as const;

export const configureQuotationsModule = async ({
  db,
  options: quotationsOptions = {},
}: {
  db: DrizzleDb;
  options?: QuotationsSettingsOptions;
}) => {
  registerEvents(QUOTATION_EVENTS);

  quotationsSettings.configureSettings(quotationsOptions);

  const buildConditions = (query: QuotationQuery): SQL[] => {
    const conditions: SQL[] = [];

    if (query.userId) {
      conditions.push(eq(quotations.userId, query.userId));
    }

    if (query.quotationIds?.length) {
      conditions.push(inArray(quotations._id, query.quotationIds));
    }

    if (query.searchQuotationIds?.length) {
      conditions.push(inArray(quotations._id, query.searchQuotationIds));
    }

    return conditions;
  };

  const buildOrderBy = (sort?: SortOption[]) => {
    if (!sort?.length) return [asc(quotations.created)];
    return sort.map((s) => {
      const column = COLUMNS[s.key as keyof typeof COLUMNS] ?? quotations.created;
      return s.value === SortDirection.DESC ? desc(column) : asc(column);
    });
  };

  const findNewQuotationNumber = async (quotation: Quotation, index = 0): Promise<string> => {
    const newHashID = quotationsSettings.quotationNumberHashFn(quotation, index);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(quotations)
      .where(eq(quotations.quotationNumber, newHashID))
      .limit(1);
    if ((count ?? 0) === 0) {
      return newHashID;
    }
    return findNewQuotationNumber(quotation, index + 1);
  };

  const updateStatus = async (
    quotationId: string,
    { status, info = '' }: { status: QuotationStatus; info?: string },
  ) => {
    const [row] = await db.select().from(quotations).where(eq(quotations._id, quotationId)).limit(1);

    if (!row) return null;
    const quotation = rowToQuotation(row);

    if (quotation.status === status) return quotation;

    const date = new Date();
    const updateData: Record<string, any> = {
      status,
      updated: date,
    };

    switch (status) {
      // explicitly use fallthrough here!
      case QuotationStatus.FULFILLED:
        if (!quotation.fulfilled) {
          updateData.fulfilled = date;
        }
        updateData.expires = date;
      // eslint-disable-next-line no-fallthrough
      case QuotationStatus.PROCESSING:
        if (!quotation.quotationNumber) {
          updateData.quotationNumber = await findNewQuotationNumber(quotation);
        }
        break;
      case QuotationStatus.REJECTED:
        updateData.expires = date;
        updateData.rejected = date;
        break;
      default:
        break;
    }

    // Add log entry
    const newLog = [...quotation.log, { date: date.toISOString(), status, info }];
    updateData.log = newLog;

    await db.update(quotations).set(updateData).where(eq(quotations._id, quotationId));

    const [updatedRow] = await db
      .select()
      .from(quotations)
      .where(eq(quotations._id, quotationId))
      .limit(1);

    const updatedQuotation = rowToQuotation(updatedRow!);
    await emit('QUOTATION_UPDATE', { quotation: updatedQuotation, field: 'status' });

    return updatedQuotation;
  };

  const updateQuotationFields = (fieldKeys: string[]) => async (quotationId: string, values: any) => {
    const [row] = await db.select().from(quotations).where(eq(quotations._id, quotationId)).limit(1);

    if (!row) return null;

    const updateData: Record<string, any> = {
      updated: new Date(),
    };

    for (const key of fieldKeys) {
      if (values[key] !== undefined) {
        updateData[key] = values[key];
      }
    }

    await db.update(quotations).set(updateData).where(eq(quotations._id, quotationId));

    const [updatedRow] = await db
      .select()
      .from(quotations)
      .where(eq(quotations._id, quotationId))
      .limit(1);
    const quotation = rowToQuotation(updatedRow!);

    await emit('QUOTATION_UPDATE', { quotation, fields: fieldKeys });
    return quotation;
  };

  return {
    // Queries
    count: async (query: QuotationQuery): Promise<number> => {
      const conditions = buildConditions(query);
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(quotations)
        .where(whereClause);
      return count ?? 0;
    },

    openQuotationWithProduct: async ({ productId }: { productId: string }) => {
      const [row] = await db
        .select()
        .from(quotations)
        .where(
          and(
            eq(quotations.productId, productId),
            or(
              eq(quotations.status, QuotationStatus.REQUESTED),
              eq(quotations.status, QuotationStatus.PROPOSED),
            ),
          ),
        )
        .limit(1);
      return row ? rowToQuotation(row) : null;
    },

    findQuotation: async ({ quotationId }: { quotationId: string }, options?: QuotationQueryOptions) => {
      const selectColumns = buildSelectColumns(COLUMNS, options?.fields);

      const baseQuery = selectColumns
        ? db.select(selectColumns).from(quotations)
        : db.select().from(quotations);

      const [row] = await baseQuery.where(eq(quotations._id, quotationId)).limit(1);
      return row
        ? selectColumns
          ? (row as unknown as Quotation)
          : rowToQuotation(row as QuotationRow)
        : null;
    },

    findQuotations: async (
      queryOrParams: QuotationQuery & {
        limit?: number;
        offset?: number;
        sort?: SortOption[];
      },
      options?: {
        limit?: number;
        skip?: number;
        sort?: Record<string, 1 | -1>;
      },
    ): Promise<Quotation[]> => {
      // Support both signature patterns:
      // 1. Single arg with limit/offset/sort embedded in query
      // 2. Two args with query and options separately
      let limit: number | undefined;
      let offset: number | undefined;
      let sort: SortOption[] | undefined;
      let query: QuotationQuery;

      if (options) {
        // Two-argument pattern
        query = queryOrParams;
        limit = options.limit;
        offset = options.skip;
        // Convert MongoDB-style sort (1/-1) to SortOption[] (ASC/DESC)
        sort = options.sort
          ? Object.entries(options.sort).map(([key, value]) => ({
              key,
              value: value === 1 ? SortDirection.ASC : SortDirection.DESC,
            }))
          : undefined;
      } else {
        // Single-argument pattern
        const { limit: l, offset: o, sort: s, ...q } = queryOrParams;
        query = q;
        limit = l;
        offset = o;
        sort = s;
      }

      const conditions = buildConditions(query);
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const orderBy = buildOrderBy(sort);
      const results = await db
        .select()
        .from(quotations)
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(limit ?? 1000)
        .offset(offset ?? 0);
      return results.map(rowToQuotation);
    },

    // Transformations
    normalizedStatus: (quotation: Quotation): QuotationStatus => {
      return quotation.status === null
        ? QuotationStatus.REQUESTED
        : (quotation.status as QuotationStatus);
    },

    isExpired(quotation: Quotation, { referenceDate }: { referenceDate?: Date } = {}) {
      const relevantDate = referenceDate ? new Date(referenceDate) : new Date();
      if (!quotation.expires) return false;
      const expiryDate = new Date(quotation.expires);
      const isQuotationExpired = relevantDate.getTime() > expiryDate.getTime();
      return isQuotationExpired;
    },

    isProposalValid(quotation: Quotation): boolean {
      return quotation.status === QuotationStatus.PROPOSED && !this.isExpired(quotation);
    },

    // Mutations
    create: async ({
      countryCode,
      currencyCode,
      ...quotationData
    }: QuotationData & { currencyCode: string }) => {
      const quotationId = generateId();
      const now = new Date();

      await db.insert(quotations).values({
        _id: quotationId,
        userId: quotationData.userId,
        productId: quotationData.productId,
        configuration: quotationData.configuration ?? [],
        countryCode,
        currencyCode,
        log: [],
        status: QuotationStatus.REQUESTED,
        created: now,
        deleted: null,
      });

      const [row] = await db.select().from(quotations).where(eq(quotations._id, quotationId)).limit(1);

      const quotation = rowToQuotation(row!);
      await emit('QUOTATION_REQUEST_CREATE', { quotation });
      return quotation;
    },

    deleteRequestedUserQuotations: async (userId: string) => {
      const result = await db
        .delete(quotations)
        .where(
          and(
            eq(quotations.userId, userId),
            or(eq(quotations.status, QuotationStatus.REQUESTED), isNull(quotations.status)),
          ),
        );
      return result.rowsAffected;
    },

    updateContext: updateQuotationFields(['context']),
    updateProposal: updateQuotationFields(['price', 'expires', 'meta']),

    updateStatus,
  };
};

export type QuotationsModule = Awaited<ReturnType<typeof configureQuotationsModule>>;
