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

const normalizeOrderAggregateResult = (data = []): OrderReport => {
  const statusToFieldMap = {
    CART: 'createdCount',
    PENDING: 'checkoutCount',
    REJECTED: 'rejectionCount',
    CONFIRMED: 'confirmationCount',
    FULLFILLED: 'fullfilledCount',
  };
  const orderStatistics = {
    ...Object.values(statusToFieldMap).reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
  } as OrderReport;

  data.forEach((item) => {
    orderStatistics[statusToFieldMap[item.status]] = item.count;
  });
  return orderStatistics;
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
      const pipeline = [];
      const matchConditions = [];
      if (from || to) {
        const dateConditions = [];
        if (from) {
          const fromDate = new Date(from);
          dateConditions.push({
            $or: [{ created: { $gte: fromDate } }, { updated: { $gte: fromDate } }],
          });
        }
        if (to) {
          const toDate = new Date(to);
          dateConditions.push({
            $or: [{ created: { $lte: toDate } }, { updated: { $lte: toDate } }],
          });
        }
        if (dateConditions.length > 0) {
          matchConditions.push({ $and: dateConditions });
        }
      }
      if (matchConditions.length > 0) {
        pipeline.push({
          $match: {
            $and: matchConditions,
          },
        });
      }
      pipeline.push(
        ...[
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
          {
            $addFields: {
              status: {
                $cond: { if: { $eq: ['$_id', null] }, then: 'CART', else: '$_id' },
              },
            },
          },
          {
            $project: {
              _id: 0,
              status: 1,
              count: 1,
            },
          },
        ],
      );
      return normalizeOrderAggregateResult(await Orders.aggregate(pipeline).toArray());
    },

    orderExists: async ({ orderId }) => {
      const orderCount = await Orders.countDocuments(generateDbFilterById(orderId), {
        limit: 1,
      });
      return !!orderCount;
    },
  };
};
