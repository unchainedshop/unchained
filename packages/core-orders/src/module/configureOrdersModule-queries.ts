import { Collection, FindOptions, Query } from '@unchainedshop/types/common';
import { Order, OrderQueries, OrderQuery } from '@unchainedshop/types/orders';
import { generateDbFilterById } from 'meteor/unchained:utils';

const buildFindSelector = ({
  includeCarts,
  status,
  userId,
  queryString,
}: OrderQuery) => {
  const selector: Query = {};

  if (userId) {
    selector.userId = userId;
  }

  if (status) {
    selector.status = status;
  } else if (!includeCarts) {
    selector.status = { $ne: null }; // Status 'null' equals OrderStatus.OPEN
  }

  if (queryString) {
    selector.$text = { $search: queryString };
  }

  return selector;
};

export const configureOrdersModuleQueries = ({
  Orders,
}: {
  Orders: Collection<Order>;
}): OrderQueries => {
  return {
    // Queries
    count: async (query) => {
      const orderCount = await Orders.find(buildFindSelector(query)).count();
      return orderCount;
    },

    findOrder: async ({ orderId, orderNumber }, options) => {
      const selector = orderId
        ? generateDbFilterById(orderId)
        : { orderNumber };

      return await Orders.findOne(selector, options);
    },

    findOrders: async ({ limit, offset, queryString, ...query }, options) => {
      const findOptions: FindOptions = {
        skip: offset,
        limit,
        sort: {
          created: -1,
        },
      };
      const selector = buildFindSelector({ queryString, ...query });

      if (queryString) {
        return await Orders.find(selector, {
          ...options,
          projection: { score: { $meta: 'textScore' } },
          sort: { score: { $meta: 'textScore' } },
        }).toArray();
      }

      return await Orders.find(selector, findOptions).toArray();
    },

    orderExists: async ({ orderId }) => {
      const orderCount = await Orders.find(generateDbFilterById(orderId), {
        limit: 1,
      }).count();
      return !!orderCount;
    },
  };
};
