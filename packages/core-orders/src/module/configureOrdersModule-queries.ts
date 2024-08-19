import { SortDirection, SortOption } from '@unchainedshop/utils';
import { Order, OrderQuery, OrderStatus, OrderReport } from '../types.js';
import { generateDbFilterById, buildSortOptions, mongodb } from '@unchainedshop/mongodb';

export const buildFindSelector = ({ includeCarts, status, userId, queryString }: OrderQuery) => {
  const selector: mongodb.Filter<Order> = {};

  if (userId) {
    selector.userId = userId;
  }

  if (status) {
    selector.status = status as OrderStatus;
  } else if (!includeCarts) {
    selector.status = { $ne: null }; // TODO: Slow performance! IDXSCAN in common query!
  }

  if (queryString) {
    (selector as any).$text = { $search: queryString };
  }

  return selector;
};

const normalizeOrderAggregateResult = (data = {}): OrderReport => {
  const statusToFieldMap = {
    newCount: 0,
    checkoutCount: 0,
    rejectCount: 0,
    confirmCount: 0,
    fulfillCount: 0,
  };

  Object.entries(data).forEach(([key, value]) => {
    statusToFieldMap[key] = value;
  });
  return statusToFieldMap;
};

export const configureOrdersModuleQueries = ({ Orders }: { Orders: mongodb.Collection<Order> }) => {
  return {
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
    ): Promise<Order> => {
      const selector = orderId ? generateDbFilterById(orderId) : { orderNumber };
      return Orders.findOne(selector, options);
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
        sort?: Array<SortOption>;
      },
      options?: mongodb.FindOptions,
    ): Promise<Array<Order>> => {
      const defaultSortOption: Array<SortOption> = [{ key: 'created', value: SortDirection.DESC }];
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

    getReport: async (params?: { from?: Date; to?: Date }): Promise<OrderReport> => {
      const { from, to } = params || {};
      const selector: any = { $exists: true };
      if (from || to) {
        if (from) {
          const fromDate = new Date(from);
          selector.$gte = fromDate;
        }
        if (to) {
          const toDate = new Date(to);
          selector.$lte = toDate;
        }
      }

      const pipeline = [
        {
          $facet: {
            checkoutCount: [
              {
                $match: {
                  ordered: selector,
                },
              },
              { $count: 'count' },
            ],
            fulfillCount: [
              {
                $match: {
                  fullfilled: selector,
                },
              },
              { $count: 'count' },
            ],
            rejectCount: [
              {
                $match: {
                  rejected: selector,
                },
              },
              { $count: 'count' },
            ],
            newCount: [
              {
                $match: {
                  created: selector,
                },
              },
              { $count: 'count' },
            ],
            confirmCount: [
              {
                $match: {
                  confirmed: selector,
                },
              },
              { $count: 'count' },
            ],
          },
        },
        {
          $project: {
            checkoutCount: { $arrayElemAt: ['$checkoutCount.count', 0] },
            fulfillCount: { $arrayElemAt: ['$fulfillCount.count', 0] },
            rejectCount: { $arrayElemAt: ['$rejectCount.count', 0] },
            newCount: { $arrayElemAt: ['$newCount.count', 0] },
            confirmCount: { $arrayElemAt: ['$confirmCount.count', 0] },
          },
        },
      ];
      const [facetedResult] = await Orders.aggregate(pipeline).toArray();
      return normalizeOrderAggregateResult(facetedResult);
    },

    orderExists: async ({ orderId }: { orderId: string }): Promise<boolean> => {
      const orderCount = await Orders.countDocuments(generateDbFilterById(orderId), {
        limit: 1,
      });
      return !!orderCount;
    },
  };
};

export type OrderQueries = ReturnType<typeof configureOrdersModuleQueries>;
