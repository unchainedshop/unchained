import { SortDirection, type SortOption } from '@unchainedshop/utils';
import { generateDbFilterById, buildSortOptions, mongodb } from '@unchainedshop/mongodb';
import buildFindSelector from './buildFindSelector.ts';
import { type Order, type OrderQuery } from '../db/OrdersCollection.ts';

export interface OrderReport {
  newCount: number;
  checkoutCount: number;
  rejectCount: number;
  confirmCount: number;
  fulfillCount: number;
}

export interface TopCustomerRecord {
  userId: string;
  currencyCode: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: Date;
  averageOrderValue: number;
}
export interface OrderStatisticsRecord {
  date: string;
  count: number;
  total: {
    amount: number;
    currencyCode: string;
  };
}

export interface DateRange {
  start?: string;
  end?: string;
}

export type StatisticsDateField = 'created' | 'ordered' | 'rejected' | 'confirmed' | 'fullfilled';

function buildDateMatch(dateField: string, dateRange?: DateRange) {
  if (!dateRange?.start && !dateRange?.end) return { [dateField]: { $exists: true } };

  const rangeMatch: Record<string, any> = {};
  if (dateRange?.start) rangeMatch.$gte = new Date(dateRange.start);
  if (dateRange?.end) rangeMatch.$lte = new Date(dateRange.end);

  return { [dateField]: rangeMatch };
}
export interface OrderAggregateParams {
  match?: Record<string, any>;
  matchAfterGroup?: Record<string, any>;
  project?: Record<string, any>;
  group?: Record<string, any>;
  sort?: Record<string, number>;
  limit?: number;
  addFields?: Record<string, any>;
  pipeline?: any[];
}

export const configureOrdersModuleQueries = ({ Orders }: { Orders: mongodb.Collection<Order> }) => {
  return {
    isCart: (order: Order) => {
      return order.status === null;
    },

    cart: async ({
      orderNumber,
      countryCode,
      userId,
    }: {
      countryCode?: string;
      orderNumber?: string;
      userId: string;
    }) => {
      const selector: mongodb.Filter<Order> = {
        countryCode,
        status: { $eq: null },
        userId,
      };

      if (orderNumber) {
        selector.orderNumber = orderNumber;
      }

      const options: mongodb.FindOptions = {
        sort: {
          updated: -1,
        },
      };
      return Orders.findOne(selector, options);
    },

    count: async (query: OrderQuery): Promise<number> => {
      const orderCount = await Orders.countDocuments(buildFindSelector(query));
      return orderCount;
    },
    findOrder: async (
      {
        orderId,
        orderNumber,
      }: {
        orderId?: string;
        orderNumber?: string;
      },
      options?: mongodb.FindOptions,
    ) => {
      const selector = orderId ? generateDbFilterById(orderId) : { orderNumber };
      return Orders.findOne(selector, options);
    },

    findCartsToInvalidate: async (maxAgeDays = 30) => {
      const ONE_DAY_IN_MILLISECONDS = 86400000;

      const minValidDate = new Date(new Date().getTime() - maxAgeDays * ONE_DAY_IN_MILLISECONDS);

      const orders = await Orders.find({
        status: { $eq: null },
        updated: { $gte: minValidDate },
      }).toArray();

      return orders;
    },

    findOrders: async (
      {
        limit,
        offset,
        queryString,
        sort,
        ...query
      }: OrderQuery & {
        limit?: number;
        offset?: number;
        sort?: SortOption[];
      },
      options?: mongodb.FindOptions,
    ): Promise<Order[]> => {
      const defaultSortOption: SortOption[] = [{ key: 'created', value: SortDirection.DESC }];
      const findOptions: mongodb.FindOptions = {
        skip: offset,
        limit,
        sort: buildSortOptions(sort || defaultSortOption),
      };
      const selector = buildFindSelector({ queryString, ...query });

      if (queryString) {
        return Orders.find(selector, {
          ...options,
          projection: { score: { $meta: 'textScore' } },
          sort: { score: { $meta: 'textScore' } },
        }).toArray();
      }

      return Orders.find(selector, findOptions).toArray();
    },
    orderExists: async ({ orderId }: { orderId: string }): Promise<boolean> => {
      const orderCount = await Orders.countDocuments(generateDbFilterById(orderId), {
        limit: 1,
      });
      return !!orderCount;
    },
    aggregateOrders: async ({
      match,
      project,
      group,
      sort,
      limit,
      addFields,
      pipeline,
    }: OrderAggregateParams): Promise<mongodb.Document[]> => {
      const stages: mongodb.Document[] = [];
      if (pipeline?.length) {
        return await Orders.aggregate(pipeline).toArray();
      }

      if (match) stages.push({ $match: match });
      if (project) stages.push({ $project: project });
      if (group) stages.push({ $group: group });
      if (addFields) stages.push({ $addFields: addFields });
      if (sort) stages.push({ $sort: sort });
      if (typeof limit === 'number') stages.push({ $limit: limit });

      return Orders.aggregate(stages, { allowDiskUse: true }).toArray();
    },

    // Statistics methods
    statistics: {
      async countByDateField(
        dateField: StatisticsDateField,
        dateRange?: DateRange,
        options?: { includeCarts?: boolean },
      ): Promise<number> {
        const match: mongodb.BSON.Document = buildDateMatch(dateField, dateRange);

        if (options?.includeCarts) {
          match.status = null;
          match.orderNumber = null;
        }

        const pipeline: mongodb.BSON.Document[] = [{ $match: match }, { $count: 'count' }];
        const result = await Orders.aggregate(pipeline).toArray();
        return result[0]?.count ?? 0;
      },

      async aggregateByDateField(
        dateField: StatisticsDateField,
        dateRange?: DateRange,
        options?: { includeCarts?: boolean },
      ): Promise<OrderStatisticsRecord[]> {
        const match: mongodb.BSON.Document = buildDateMatch(dateField, dateRange);

        if (options?.includeCarts) {
          match.status = null;
          match.orderNumber = null;
        }

        const pipeline: mongodb.BSON.Document[] = [
          { $match: match },
          {
            $addFields: {
              orderTotal: {
                $reduce: {
                  input: { $ifNull: ['$calculation', []] },
                  initialValue: 0,
                  in: { $add: ['$$value', { $ifNull: ['$$this.amount', 0] }] },
                },
              },
            },
          },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: '%Y-%m-%d', date: `$${dateField}` } },
                currency: '$currencyCode',
              },
              totalAmount: { $sum: '$orderTotal' },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              date: '$_id.date',
              total: { amount: '$totalAmount', currencyCode: '$_id.currency' },
              count: 1,
            },
          },
          { $sort: { date: 1 } },
        ];

        return Orders.aggregate(pipeline).toArray() as Promise<OrderStatisticsRecord[]>;
      },

      async getTopCustomers(
        orderIds: string[],
        options?: { limit?: number },
      ): Promise<TopCustomerRecord[]> {
        const limit = options?.limit || 10;

        const pipeline: mongodb.BSON.Document[] = [
          { $match: { _id: { $in: orderIds } } },
          {
            $project: {
              userId: 1,
              created: 1,
              currencyCode: 1,
              itemAmount: {
                $let: {
                  vars: {
                    item: {
                      $first: {
                        $filter: {
                          input: '$calculation',
                          as: 'c',
                          cond: { $eq: ['$$c.category', 'ITEMS'] },
                        },
                      },
                    },
                  },
                  in: '$$item.amount',
                },
              },
            },
          },
          {
            $group: {
              _id: { userId: '$userId', currencyCode: '$currencyCode' },
              totalSpent: { $sum: '$itemAmount' },
              orderCount: { $sum: 1 },
              lastOrderDate: { $max: '$created' },
            },
          },
          { $match: { totalSpent: { $gt: 0 } } },
          {
            $addFields: {
              averageOrderValue: {
                $cond: [{ $eq: ['$orderCount', 0] }, 0, { $divide: ['$totalSpent', '$orderCount'] }],
              },
              currencyCode: '$_id.currencyCode',
              userId: '$_id.userId',
            },
          },
          { $sort: { totalSpent: -1 } },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              userId: 1,
              currencyCode: 1,
              totalSpent: 1,
              orderCount: 1,
              lastOrderDate: 1,
              averageOrderValue: 1,
            },
          },
        ];

        return Orders.aggregate(pipeline, { allowDiskUse: true }).toArray() as Promise<
          TopCustomerRecord[]
        >;
      },
    },
  };
};

export type OrderQueries = ReturnType<typeof configureOrdersModuleQueries>;
