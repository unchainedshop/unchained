import { SortDirection, SortOption } from '@unchainedshop/types/api.js';
import { Order, OrderQueries, OrderQuery, OrderStatus } from '@unchainedshop/types/orders.js';
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

    orderExists: async ({ orderId }) => {
      const orderCount = await Orders.countDocuments(generateDbFilterById(orderId), {
        limit: 1,
      });
      return !!orderCount;
    },
  };
};
