import { SortDirection, SortOption } from '@unchainedshop/types/api.js';
import {
  Order,
  OrderQueries,
  OrderQuery,
  OrderReport,
  OrderStatus,
} from '@unchainedshop/types/orders.js';

import { generateDbFilterById, buildSortOptions, mongodb } from '@unchainedshop/mongodb';

export const buildFindSelector = ({ includeCarts, status, userId, queryString }: OrderQuery) => {
  const selector: mongodb.Filter<Order> = {};

  if (userId) {
    selector.userId = userId;
  }

  if (Array.isArray(status) && status?.length) {
    selector.status = { $in: status };
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

export const configureOrdersModuleQueries = ({
  Orders,
}: {
  Orders: mongodb.Collection<Order>;
}): OrderQueries => {
  return {
    count: async (query) => {
      const orderCount = await Orders.countDocuments(buildFindSelector(query));
      return orderCount;
    },

    findOrder: async ({ orderId, orderNumber }, options) => {
      const selector = orderId ? generateDbFilterById(orderId) : { orderNumber };
      return Orders.findOne(selector, options);
    },

    findOrders: async ({ limit, offset, queryString, sort, ...query }, options) => {
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

    getReport: async ({ from, to } = { from: null, to: null }) => {
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

    orderExists: async ({ orderId }) => {
      const orderCount = await Orders.countDocuments(generateDbFilterById(orderId), {
        limit: 1,
      });
      return !!orderCount;
    },
  };
};
