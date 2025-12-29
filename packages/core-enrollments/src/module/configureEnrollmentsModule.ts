import { SortDirection, type SortOption } from '@unchainedshop/utils';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  eq,
  and,
  or,
  isNull,
  inArray,
  sql,
  asc,
  desc,
  generateId,
  type SQL,
  type DrizzleDb,
} from '@unchainedshop/store';
import {
  enrollments,
  EnrollmentStatus,
  type EnrollmentRow,
  type EnrollmentPeriod,
  type EnrollmentPlan,
} from '../db/schema.ts';
import { searchEnrollmentsFTS } from '../db/fts.ts';
import { enrollmentsSettings, type EnrollmentsSettingsOptions } from '../enrollments-settings.ts';

export interface Address {
  firstName?: string;
  lastName?: string;
  company?: string;
  addressLine?: string;
  addressLine2?: string;
  postalCode?: string;
  regionCode?: string;
  city?: string;
  countryCode?: string;
}

export interface Contact {
  emailAddress?: string;
  telNumber?: string;
}

export interface EnrollmentLogEntry {
  date: Date;
  status: string;
  info: string;
}

export interface Enrollment {
  _id: string;
  billingAddress: Address;
  configuration: { key: string; value: string }[] | null;
  contact: Contact;
  context?: any;
  countryCode: string;
  currencyCode: string;
  delivery: {
    deliveryProviderId?: string;
    context?: any;
  };
  enrollmentNumber?: string;
  orderIdForFirstPeriod?: string;
  expires?: Date;
  meta?: any;
  payment?: {
    paymentProviderId: string;
    context?: any;
  };
  periods: EnrollmentPeriod[];
  productId: string;
  quantity?: number;
  status: EnrollmentStatus | null;
  userId: string;
  log: EnrollmentLogEntry[];
  created: Date;
  updated?: Date;
  deleted?: Date | null;
}

export interface EnrollmentQuery {
  status?: EnrollmentStatus[];
  userId?: string;
  queryString?: string;
}

export type EnrollmentFields = keyof Enrollment;

export interface EnrollmentQueryOptions {
  fields?: EnrollmentFields[];
}

const ENROLLMENT_EVENTS: string[] = [
  'ENROLLMENT_ADD_PERIOD',
  'ENROLLMENT_CREATE',
  'ENROLLMENT_REMOVE',
  'ENROLLMENT_UPDATE',
];

const rowToEnrollment = (row: EnrollmentRow): Enrollment => ({
  _id: row._id,
  userId: row.userId,
  productId: row.productId,
  quantity: row.quantity ?? undefined,
  countryCode: row.countryCode,
  currencyCode: row.currencyCode,
  enrollmentNumber: row.enrollmentNumber ?? undefined,
  orderIdForFirstPeriod: row.orderIdForFirstPeriod ?? undefined,
  status: row.status as EnrollmentStatus | null,
  expires: row.expires ?? undefined,
  configuration: row.configuration ? JSON.parse(row.configuration) : null,
  context: row.context ? JSON.parse(row.context) : undefined,
  meta: row.meta ? JSON.parse(row.meta) : undefined,
  billingAddress: row.billingAddress ? JSON.parse(row.billingAddress) : {},
  contact: row.contact ? JSON.parse(row.contact) : {},
  delivery: row.delivery ? JSON.parse(row.delivery) : {},
  payment: row.payment ? JSON.parse(row.payment) : undefined,
  periods: row.periods ? JSON.parse(row.periods) : [],
  log: row.log ? JSON.parse(row.log) : [],
  created: row.created,
  updated: row.updated ?? undefined,
  deleted: row.deleted ?? null,
});

const COLUMNS = {
  _id: enrollments._id,
  userId: enrollments.userId,
  productId: enrollments.productId,
  quantity: enrollments.quantity,
  countryCode: enrollments.countryCode,
  currencyCode: enrollments.currencyCode,
  enrollmentNumber: enrollments.enrollmentNumber,
  orderIdForFirstPeriod: enrollments.orderIdForFirstPeriod,
  status: enrollments.status,
  expires: enrollments.expires,
  configuration: enrollments.configuration,
  context: enrollments.context,
  meta: enrollments.meta,
  billingAddress: enrollments.billingAddress,
  contact: enrollments.contact,
  delivery: enrollments.delivery,
  payment: enrollments.payment,
  periods: enrollments.periods,
  log: enrollments.log,
  created: enrollments.created,
  updated: enrollments.updated,
  deleted: enrollments.deleted,
} as const;

const buildSelectColumns = (fields?: EnrollmentFields[]) => {
  if (!fields?.length) return undefined;
  return Object.fromEntries(
    fields.map((field) => [field, COLUMNS[field as keyof typeof COLUMNS]]),
  ) as Partial<typeof COLUMNS>;
};

export const configureEnrollmentsModule = async ({
  db,
  options: enrollmentOptions = {},
}: {
  db: DrizzleDb;
  options?: EnrollmentsSettingsOptions;
}) => {
  registerEvents(ENROLLMENT_EVENTS);

  enrollmentsSettings.configureSettings(enrollmentOptions);

  const buildConditions = async (query: EnrollmentQuery): Promise<SQL[]> => {
    const conditions: SQL[] = [isNull(enrollments.deleted)];

    if (query.status?.length) {
      conditions.push(inArray(enrollments.status, query.status));
    }

    if (query.userId) {
      conditions.push(eq(enrollments.userId, query.userId));
    }

    if (query.queryString) {
      const matchingIds = await searchEnrollmentsFTS(db, query.queryString);
      if (matchingIds.length === 0) {
        conditions.push(sql`1 = 0`);
      } else {
        conditions.push(inArray(enrollments._id, matchingIds));
      }
    }

    return conditions;
  };

  const buildOrderBy = (sort?: SortOption[]) => {
    if (!sort?.length) return [asc(enrollments.created)];
    return sort.map((s) => {
      const column = COLUMNS[s.key as keyof typeof COLUMNS] ?? enrollments.created;
      return s.value === SortDirection.DESC ? desc(column) : asc(column);
    });
  };

  const isExpired = (enrollment: Enrollment, { referenceDate }: { referenceDate?: Date }) => {
    const relevantDate = referenceDate ? new Date(referenceDate) : new Date();
    if (!enrollment.expires) return false;
    const expiryDate = new Date(enrollment.expires);
    return relevantDate.getTime() > expiryDate.getTime();
  };

  const findNewEnrollmentNumber = async (enrollment: Enrollment, index = 0): Promise<string> => {
    const newHashID = enrollmentsSettings.enrollmentNumberHashFn(enrollment, index);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(eq(enrollments.enrollmentNumber, newHashID))
      .limit(1);
    if ((count ?? 0) === 0) {
      return newHashID;
    }
    return findNewEnrollmentNumber(enrollment, index + 1);
  };

  const updateStatus = async (
    enrollmentId: string,
    { status, info = '' }: { status: EnrollmentStatus; info?: string },
  ) => {
    const [row] = await db.select().from(enrollments).where(eq(enrollments._id, enrollmentId)).limit(1);

    if (!row) return null;
    const enrollment = rowToEnrollment(row);

    if (enrollment.status === status) return enrollment;

    const date = new Date();
    const updateData: Record<string, any> = {
      status,
      updated: date,
    };

    switch (status) {
      case EnrollmentStatus.ACTIVE:
        updateData.enrollmentNumber = await findNewEnrollmentNumber(enrollment);
        break;
      case EnrollmentStatus.TERMINATED:
        updateData.expires =
          enrollment.periods?.length > 0 ? enrollment.periods[enrollment.periods.length - 1].end : date;
        break;
      default:
        break;
    }

    // Add log entry
    const newLog = [...enrollment.log, { date, status, info }];
    updateData.log = JSON.stringify(newLog);

    await db.update(enrollments).set(updateData).where(eq(enrollments._id, enrollmentId));

    const [updatedRow] = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments._id, enrollmentId))
      .limit(1);

    const updatedEnrollment = rowToEnrollment(updatedRow!);
    await emit('ENROLLMENT_UPDATE', { enrollment: updatedEnrollment, field: 'status' });

    return updatedEnrollment;
  };

  const updateEnrollmentField =
    <T>(fieldKey: string) =>
    async (enrollmentId: string, fieldValue: T) => {
      const updateData: Record<string, any> = {
        updated: new Date(),
      };

      // For JSON fields, stringify the value
      if (
        [
          'billingAddress',
          'contact',
          'context',
          'meta',
          'delivery',
          'payment',
          'configuration',
        ].includes(fieldKey)
      ) {
        updateData[fieldKey] = JSON.stringify(fieldValue);
      } else {
        updateData[fieldKey] = fieldValue;
      }

      await db.update(enrollments).set(updateData).where(eq(enrollments._id, enrollmentId));

      const [row] = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments._id, enrollmentId))
        .limit(1);
      if (!row) return null;

      const enrollment = rowToEnrollment(row);
      await emit('ENROLLMENT_UPDATE', { enrollment, field: fieldKey });
      return enrollment;
    };

  return {
    // Queries
    count: async (query: EnrollmentQuery) => {
      const conditions = await buildConditions(query);
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(enrollments)
        .where(whereClause);
      return count ?? 0;
    },

    openEnrollmentWithProduct: async ({ productId }: { productId: string }) => {
      const [row] = await db
        .select()
        .from(enrollments)
        .where(
          and(
            eq(enrollments.productId, productId),
            or(
              eq(enrollments.status, EnrollmentStatus.ACTIVE),
              eq(enrollments.status, EnrollmentStatus.PAUSED),
            ),
          ),
        )
        .limit(1);
      return row ? rowToEnrollment(row) : null;
    },

    findEnrollment: async (
      params: { enrollmentId: string } | { orderId: string },
      options?: EnrollmentQueryOptions,
    ) => {
      const selectColumns = buildSelectColumns(options?.fields);

      if ('enrollmentId' in params) {
        const baseQuery = selectColumns
          ? db.select(selectColumns).from(enrollments)
          : db.select().from(enrollments);
        const [row] = await baseQuery.where(eq(enrollments._id, params.enrollmentId)).limit(1);
        return row
          ? selectColumns
            ? (row as unknown as Enrollment)
            : rowToEnrollment(row as EnrollmentRow)
          : null;
      }
      // Search for enrollment by orderId in periods
      const baseQuery = selectColumns
        ? db.select(selectColumns).from(enrollments)
        : db.select().from(enrollments);
      const results = await baseQuery.where(
        and(
          isNull(enrollments.deleted),
          sql`${enrollments.periods} LIKE ${`%"orderId":"${params.orderId}"%`}`,
        ),
      );
      return results.length > 0
        ? selectColumns
          ? (results[0] as unknown as Enrollment)
          : rowToEnrollment(results[0] as EnrollmentRow)
        : null;
    },

    findEnrollments: async ({
      limit,
      offset,
      sort,
      ...query
    }: EnrollmentQuery & {
      limit?: number;
      offset?: number;
      sort?: SortOption[];
    }): Promise<Enrollment[]> => {
      const conditions = await buildConditions(query);
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const orderBy = buildOrderBy(sort);
      const results = await db
        .select()
        .from(enrollments)
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(limit ?? 1000)
        .offset(offset ?? 0);
      return results.map(rowToEnrollment);
    },

    // Transformations
    normalizedStatus: (enrollment: Enrollment): EnrollmentStatus => {
      return enrollment.status === null
        ? EnrollmentStatus.INITIAL
        : (enrollment.status as EnrollmentStatus);
    },

    isExpired,

    // Mutations
    addEnrollmentPeriod: async (enrollmentId: string, period: EnrollmentPeriod) => {
      const [row] = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments._id, enrollmentId))
        .limit(1);

      if (!row) return null;
      const enrollment = rowToEnrollment(row);

      const newPeriods = [...enrollment.periods, period];

      await db
        .update(enrollments)
        .set({
          periods: JSON.stringify(newPeriods),
          updated: new Date(),
        })
        .where(eq(enrollments._id, enrollmentId));

      const [updatedRow] = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments._id, enrollmentId))
        .limit(1);
      const updatedEnrollment = rowToEnrollment(updatedRow!);

      await emit('ENROLLMENT_ADD_PERIOD', { enrollment: updatedEnrollment });
      return updatedEnrollment;
    },

    create: async ({
      countryCode,
      currencyCode,
      ...enrollmentData
    }: Omit<Enrollment, 'status' | 'periods' | 'log' | '_id' | 'created'> &
      Pick<Partial<Enrollment>, '_id' | 'created'>): Promise<Enrollment> => {
      const enrollmentId = enrollmentData._id || generateId();
      const now = enrollmentData.created || new Date();

      await db.insert(enrollments).values({
        _id: enrollmentId,
        userId: enrollmentData.userId,
        productId: enrollmentData.productId,
        quantity: enrollmentData.quantity,
        countryCode,
        currencyCode,
        configuration: enrollmentData.configuration
          ? JSON.stringify(enrollmentData.configuration)
          : JSON.stringify([]),
        context: enrollmentData.context ? JSON.stringify(enrollmentData.context) : null,
        meta: enrollmentData.meta ? JSON.stringify(enrollmentData.meta) : null,
        billingAddress: enrollmentData.billingAddress
          ? JSON.stringify(enrollmentData.billingAddress)
          : null,
        contact: enrollmentData.contact ? JSON.stringify(enrollmentData.contact) : null,
        delivery: enrollmentData.delivery ? JSON.stringify(enrollmentData.delivery) : null,
        payment: enrollmentData.payment ? JSON.stringify(enrollmentData.payment) : null,
        orderIdForFirstPeriod: enrollmentData.orderIdForFirstPeriod,
        status: EnrollmentStatus.INITIAL,
        periods: JSON.stringify([]),
        log: JSON.stringify([]),
        created: now,
        deleted: null,
      });

      const [row] = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments._id, enrollmentId))
        .limit(1);

      const enrollment = rowToEnrollment(row!);
      await emit('ENROLLMENT_CREATE', { enrollment });
      return enrollment;
    },

    delete: async (enrollmentId: string) => {
      const result = await db
        .update(enrollments)
        .set({ deleted: new Date() })
        .where(eq(enrollments._id, enrollmentId));

      await emit('ENROLLMENT_REMOVE', { enrollmentId });
      return result.rowsAffected;
    },

    removeEnrollmentPeriodByOrderId: async (enrollmentId: string, orderId: string) => {
      const [row] = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments._id, enrollmentId))
        .limit(1);

      if (!row) return null;
      const enrollment = rowToEnrollment(row);

      const newPeriods = enrollment.periods.filter(
        (p) => p.orderId !== orderId && p.orderId !== undefined,
      );

      await db
        .update(enrollments)
        .set({
          periods: JSON.stringify(newPeriods),
          updated: new Date(),
        })
        .where(eq(enrollments._id, enrollmentId));

      const [updatedRow] = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments._id, enrollmentId))
        .limit(1);
      return updatedRow ? rowToEnrollment(updatedRow) : null;
    },

    updateBillingAddress: updateEnrollmentField<Address>('billingAddress'),
    updateContact: updateEnrollmentField<Contact>('contact'),
    updateContext: updateEnrollmentField<any>('meta'),
    updateDelivery: updateEnrollmentField<Enrollment['delivery']>('delivery'),
    updatePayment: updateEnrollmentField<Enrollment['payment']>('payment'),

    updatePlan: async (enrollmentId: string, plan: EnrollmentPlan) => {
      await db
        .update(enrollments)
        .set({
          productId: plan.productId,
          quantity: plan.quantity,
          configuration: plan.configuration ? JSON.stringify(plan.configuration) : null,
          updated: new Date(),
        })
        .where(eq(enrollments._id, enrollmentId));

      const [row] = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments._id, enrollmentId))
        .limit(1);
      if (!row) return null;

      const enrollment = rowToEnrollment(row);
      await emit('ENROLLMENT_UPDATE', { enrollment, field: 'plan' });
      return enrollment;
    },

    updateStatus,

    deleteInactiveUserEnrollments: async (userId: string) => {
      const result = await db
        .delete(enrollments)
        .where(
          and(
            eq(enrollments.userId, userId),
            or(
              sql`${enrollments.status} IS NULL`,
              eq(enrollments.status, EnrollmentStatus.INITIAL),
              eq(enrollments.status, EnrollmentStatus.TERMINATED),
            ),
          ),
        );
      return result.rowsAffected;
    },
  };
};

export type EnrollmentsModule = Awaited<ReturnType<typeof configureEnrollmentsModule>>;
