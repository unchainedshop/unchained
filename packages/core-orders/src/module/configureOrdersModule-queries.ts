import { Collection, FindOptions, Query } from '@unchainedshop/types/common';
import { Order, OrderQueries, OrdersModule } from '@unchainedshop/types/orders';
import { generateDbFilterById } from 'meteor/unchained:utils';

type FindQuery = {
  includeCarts?: boolean;
  queryString?: string;
};

const buildFindSelector = ({ includeCarts, queryString }: FindQuery) => {
  const selector: Query = {};
  if (!includeCarts) selector.status = { $ne: null };
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
