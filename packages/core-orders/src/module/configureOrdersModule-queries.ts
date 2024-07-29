import { SortDirection, SortOption } from '@unchainedshop/utils';
import { Order, OrderQuery, OrderStatus } from '../types.js';
import { generateDbFilterById, buildSortOptions, mongodb } from '@unchainedshop/mongodb';

export interface OrderQueries {
  findOrder: (
    params: {
      orderId?: string;
      orderNumber?: string;
    },
    options?: mongodb.FindOptions,
  ) => Promise<Order>;
  findOrders: (
    params: OrderQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    },
    options?: mongodb.FindOptions,
  ) => Promise<Array<Order>>;
  count: (query: OrderQuery) => Promise<number>;
  orderExists: (params: { orderId: string }) => Promise<boolean>;
}

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
