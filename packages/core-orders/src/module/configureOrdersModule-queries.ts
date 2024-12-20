import { SortDirection, SortOption, DateFilterInput } from '@unchainedshop/utils';
import { generateDbFilterById, buildSortOptions, mongodb } from '@unchainedshop/mongodb';
import buildFindSelector from './buildFindSelector.js';
import { Order, OrderQuery } from '../db/OrdersCollection.js';

export type OrderReport = {
  newCount: number;
  checkoutCount: number;
  rejectCount: number;
  confirmCount: number;
  fulfillCount: number;
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
    }): Promise<Order> => {
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
    ): Promise<Order> => {
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

    getReport: async (params: { dateRange?: DateFilterInput }): Promise<OrderReport> => {
      const { dateRange } = params || {};
      const selector: any = { $exists: true };
      if (dateRange?.end || dateRange?.start) {
        if (dateRange?.start) {
          const fromDate = new Date(dateRange?.start);
          selector.$gte = fromDate;
        }
        if (dateRange?.end) {
          const toDate = new Date(dateRange?.end);
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
