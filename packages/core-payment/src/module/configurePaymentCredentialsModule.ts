import {
  eq,
  and,
  sql,
  ne,
  generateId,
  desc,
  asc,
  buildSelectColumns,
  type DrizzleDb,
  type SQL,
} from '@unchainedshop/store';
import { paymentCredentials, type PaymentCredentialsRow } from '../db/schema.ts';

export interface PaymentCredentials {
  _id: string;
  paymentProviderId: string;
  userId: string;
  token?: string;
  isPreferred?: boolean;
  meta: any;
  created: Date;
  updated?: Date;
}

export interface PaymentCredentialsQuery {
  paymentCredentialsId?: string;
  userId?: string;
  paymentProviderId?: string;
  isPreferred?: boolean;
}

export type PaymentCredentialsFields = keyof PaymentCredentials;

export interface PaymentCredentialsQueryOptions {
  fields?: PaymentCredentialsFields[];
}

const COLUMNS = {
  _id: paymentCredentials._id,
  paymentProviderId: paymentCredentials.paymentProviderId,
  userId: paymentCredentials.userId,
  token: paymentCredentials.token,
  isPreferred: paymentCredentials.isPreferred,
  meta: paymentCredentials.meta,
  created: paymentCredentials.created,
  updated: paymentCredentials.updated,
} as const;

const rowToPaymentCredentials = (row: PaymentCredentialsRow): PaymentCredentials => ({
  _id: row._id,
  paymentProviderId: row.paymentProviderId,
  userId: row.userId,
  token: row.token ?? undefined,
  isPreferred: row.isPreferred ?? undefined,
  meta: row.meta ?? undefined,
  created: row.created,
  updated: row.updated ?? undefined,
});

export const configurePaymentCredentialsModule = (db: DrizzleDb) => {
  const markPreferred = async ({
    userId,
    paymentCredentialsId,
  }: {
    userId: string;
    paymentCredentialsId: string;
  }) => {
    // Set the specified credentials as preferred
    await db
      .update(paymentCredentials)
      .set({ isPreferred: true })
      .where(eq(paymentCredentials._id, paymentCredentialsId));

    // Unset all other credentials for this user
    await db
      .update(paymentCredentials)
      .set({ isPreferred: false })
      .where(
        and(ne(paymentCredentials._id, paymentCredentialsId), eq(paymentCredentials.userId, userId)),
      );

    // Return the updated credential
    const [row] = await db
      .select()
      .from(paymentCredentials)
      .where(eq(paymentCredentials._id, paymentCredentialsId))
      .limit(1);

    return row ? rowToPaymentCredentials(row) : null;
  };

  return {
    markPreferred,

    async count(query: PaymentCredentialsQuery = {}): Promise<number> {
      const conditions: SQL<unknown>[] = [];
      if (query.paymentCredentialsId) {
        conditions.push(eq(paymentCredentials._id, query.paymentCredentialsId));
      }
      if (query.userId) {
        conditions.push(eq(paymentCredentials.userId, query.userId));
      }
      if (query.paymentProviderId) {
        conditions.push(eq(paymentCredentials.paymentProviderId, query.paymentProviderId));
      }
      if (query.isPreferred !== undefined) {
        conditions.push(eq(paymentCredentials.isPreferred, query.isPreferred));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(paymentCredentials)
        .where(whereClause);
      return count ?? 0;
    },

    credentialsExists: async ({
      paymentCredentialsId,
    }: {
      paymentCredentialsId: string;
    }): Promise<boolean> => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(paymentCredentials)
        .where(eq(paymentCredentials._id, paymentCredentialsId))
        .limit(1);
      return (count ?? 0) > 0;
    },

    findPaymentCredential: async (
      { paymentCredentialsId, userId, paymentProviderId, isPreferred }: PaymentCredentialsQuery,
      options?: PaymentCredentialsQueryOptions,
    ) => {
      const conditions: SQL<unknown>[] = [];

      if (paymentCredentialsId) {
        conditions.push(eq(paymentCredentials._id, paymentCredentialsId));
      } else {
        if (userId) conditions.push(eq(paymentCredentials.userId, userId));
        if (paymentProviderId)
          conditions.push(eq(paymentCredentials.paymentProviderId, paymentProviderId));
      }

      if (isPreferred !== undefined) {
        conditions.push(eq(paymentCredentials.isPreferred, isPreferred));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const selectColumns = buildSelectColumns(COLUMNS, options?.fields);

      const baseQuery = selectColumns
        ? db.select(selectColumns).from(paymentCredentials)
        : db.select().from(paymentCredentials);

      const [row] = await baseQuery.where(whereClause).limit(1);

      return row
        ? selectColumns
          ? (row as PaymentCredentials)
          : rowToPaymentCredentials(row as PaymentCredentialsRow)
        : null;
    },

    findPaymentCredentials: async (
      query: PaymentCredentialsQuery = {},
      options?: { sort?: { created?: number } },
    ): Promise<PaymentCredentials[]> => {
      const conditions: SQL<unknown>[] = [];
      if (query.paymentCredentialsId) {
        conditions.push(eq(paymentCredentials._id, query.paymentCredentialsId));
      }
      if (query.userId) {
        conditions.push(eq(paymentCredentials.userId, query.userId));
      }
      if (query.paymentProviderId) {
        conditions.push(eq(paymentCredentials.paymentProviderId, query.paymentProviderId));
      }
      if (query.isPreferred !== undefined) {
        conditions.push(eq(paymentCredentials.isPreferred, query.isPreferred));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      let queryBuilder = db.select().from(paymentCredentials).where(whereClause);

      // Handle sort options
      if (options?.sort?.created) {
        queryBuilder = queryBuilder.orderBy(
          options.sort.created === -1
            ? desc(paymentCredentials.created)
            : asc(paymentCredentials.created),
        ) as typeof queryBuilder;
      }

      const results = await queryBuilder;

      return results.map(rowToPaymentCredentials);
    },

    upsertCredentials: async ({
      userId,
      paymentProviderId,
      _id,
      token,
      ...meta
    }: Partial<PaymentCredentials> & {
      userId: PaymentCredentials['userId'];
      paymentProviderId: PaymentCredentials['paymentProviderId'];
      _id?: PaymentCredentials['_id'];
      token?: PaymentCredentials['token'];
    } & Record<string, any>) => {
      const insertedId = _id || generateId();
      const now = new Date();

      // Check if credential exists
      let existingConditions;
      if (_id) {
        existingConditions = eq(paymentCredentials._id, _id);
      } else {
        existingConditions = and(
          eq(paymentCredentials.userId, userId),
          eq(paymentCredentials.paymentProviderId, paymentProviderId),
        );
      }

      const [existing] = await db.select().from(paymentCredentials).where(existingConditions).limit(1);

      if (existing) {
        // Update existing
        await db
          .update(paymentCredentials)
          .set({
            updated: now,
            token,
            meta: Object.keys(meta).length > 0 ? (meta as Record<string, unknown>) : existing.meta,
          })
          .where(eq(paymentCredentials._id, existing._id));
      } else {
        // Insert new
        await db.insert(paymentCredentials).values({
          _id: insertedId,
          userId,
          paymentProviderId,
          isPreferred: false,
          token,
          meta: Object.keys(meta).length > 0 ? (meta as Record<string, unknown>) : null,
          created: now,
        });
      }

      const credentialId = existing?._id || insertedId;
      const result = await markPreferred({
        userId,
        paymentCredentialsId: credentialId,
      });

      return result as PaymentCredentials;
    },

    removeCredentials: async (paymentCredentialsId: string) => {
      const [row] = await db
        .select()
        .from(paymentCredentials)
        .where(eq(paymentCredentials._id, paymentCredentialsId))
        .limit(1);

      if (!row) return null;

      await db.delete(paymentCredentials).where(eq(paymentCredentials._id, paymentCredentialsId));

      return rowToPaymentCredentials(row);
    },

    deleteUserPaymentCredentials: async (userId: string): Promise<number> => {
      const result = await db.delete(paymentCredentials).where(eq(paymentCredentials.userId, userId));
      return result.rowsAffected;
    },
  };
};

export type PaymentCredentialsModule = ReturnType<typeof configurePaymentCredentialsModule>;
