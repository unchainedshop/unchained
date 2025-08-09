import { Context } from '../../context.js';
import { OrderStatus } from '@unchainedshop/core-orders';
import { PaymentProviderType } from '@unchainedshop/core-payment';
import { DeliveryProviderType } from '@unchainedshop/core-delivery';
import { formatSummaryMap, resolveDateRange, resolveOrderFilters } from '../utils/orderFilters.js';
import { getNormalizedProductDetails } from '../utils/getNormalizedProductDetails.js';

export type OrderStatusType = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderListOptions {
  limit?: number;
  offset?: number;
  includeCarts?: boolean;
  queryString?: string;
  status?: OrderStatusType[];
  sort?: {
    key: string;
    value: 'ASC' | 'DESC';
  }[];
  paymentProviderTypes?: PaymentProviderType[];
  deliveryProviderTypes?: DeliveryProviderType[];
  paymentProviderIds?: string[];
  deliveryProviderIds?: string[];
  dateRange?: {
    from?: string;
    to?: string;
  };
}

export interface SalesSummaryOptions {
  from?: string;
  to?: string;
  days?: number;
  paymentProviderIds?: string[];
  deliveryProviderIds?: string[];
  status?: string;
}

export interface MonthlySalesOptions {
  from?: string;
  to?: string;
  paymentProviderIds?: string[];
  deliveryProviderIds?: string[];
  status?: string;
}

export interface TopCustomersOptions {
  limit?: number;
  customerStatus?: string;
  from?: string;
  to?: string;
}

export interface TopProductsOptions {
  from?: string;
  to?: string;
  limit?: number;
}

export const configureOrderMcpModule = (context: Context) => {
  const { modules, loaders } = context;

  return {
    list: async (options: OrderListOptions = {}) => {
      const {
        limit = 10,
        offset = 0,
        includeCarts = false,
        queryString,
        status,
        sort,
        paymentProviderTypes = [],
        deliveryProviderTypes = [],
        paymentProviderIds = [],
        deliveryProviderIds = [],
        dateRange,
      } = options as any;

      const filters = await resolveOrderFilters(modules, {
        paymentProviderIds: [...paymentProviderIds, ...paymentProviderTypes],
        deliveryProviderIds: [...deliveryProviderIds, ...deliveryProviderTypes],
      });

      if (!filters) {
        return [];
      }

      const sortOptions = sort?.map((s) => ({ key: s.key, value: s.value as any })) || undefined;

      const findOptions = {
        queryString,
        includeCarts,
        status,
        dateRange,
        ...filters,
      } as any;

      const orders = await modules.orders.findOrders(findOptions, {
        limit,
        skip: offset,
        sort: sortOptions as any,
      });

      return orders;
    },

    salesSummary: async (options: SalesSummaryOptions = {}) => {
      const { from, to, days = 30, paymentProviderIds, deliveryProviderIds, status } = options;
      const { startDate, endDate } = resolveDateRange(from, to, days);

      const filters = await resolveOrderFilters(modules, { paymentProviderIds, deliveryProviderIds });
      if (!filters) {
        return {
          totalSalesAmount: 0,
          orderCount: 0,
          averageOrderValue: 0,
          currencyCode: null,
          summary: [],
          dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
        };
      }

      const orders = await modules.orders.findOrders({
        dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
        ...filters,
        status,
      } as any);

      let totalSalesAmount = 0;
      let orderCount = 0;

      const dateMap = new Map<string, { sales: number; orders: number }>();
      for (let i = 0; i < days; i++) {
        const date = new Date(endDate.getTime() - i * 86400000);
        const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dateMap.set(label, { sales: 0, orders: 0 });
      }

      for (const order of orders) {
        const orderDate = new Date(order.created);
        if (orderDate < startDate || orderDate > endDate) continue;

        orderCount++;
        const itemsAmount = order.calculation?.find((c) => c.category === 'ITEMS')?.amount || 0;
        totalSalesAmount += itemsAmount;

        const label = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const entry = dateMap.get(label);
        if (entry) {
          entry.sales += itemsAmount;
          entry.orders += 1;
        }
      }

      const averageOrderValue = orderCount > 0 ? totalSalesAmount / orderCount : 0;

      return {
        totalSalesAmount,
        orderCount,
        averageOrderValue,
        currencyCode: orders[0]?.currencyCode ?? null,
        summary: formatSummaryMap(dateMap),
        dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
      };
    },

    monthlyBreakdown: async (options: MonthlySalesOptions = {}) => {
      const { from, to, paymentProviderIds, deliveryProviderIds, status } = options;
      const { startDate, endDate } = resolveDateRange(from, to);

      const filters = await resolveOrderFilters(modules, { paymentProviderIds, deliveryProviderIds });
      if (!filters) {
        return {
          totalSalesAmount: 0,
          orderCount: 0,
          averageOrderValue: 0,
          currencyCode: null,
          summary: [],
          dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
        };
      }

      const orders = await modules.orders.findOrders({
        dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
        status,
        ...filters,
      } as any);

      let totalSalesAmount = 0;
      let orderCount = 0;

      const monthlyMap = new Map<string, { sales: number; orders: number }>();

      for (let i = 0; i < 12; i++) {
        const date = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
        const label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(label, { sales: 0, orders: 0 });
      }

      for (const order of orders) {
        const orderDate = new Date(order.created);
        if (orderDate < startDate || orderDate > endDate) continue;

        orderCount++;
        const itemsAmount = order.calculation?.find((c) => c.category === 'ITEMS')?.amount || 0;
        totalSalesAmount += itemsAmount;

        const label = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        const entry = monthlyMap.get(label);
        if (entry) {
          entry.sales += itemsAmount;
          entry.orders += 1;
        }
      }

      const averageOrderValue = orderCount > 0 ? totalSalesAmount / orderCount : 0;

      return {
        totalSalesAmount,
        orderCount,
        averageOrderValue,
        currencyCode: orders[0]?.currencyCode ?? null,
        summary: formatSummaryMap(monthlyMap),
        dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
      };
    },

    topCustomers: async (options: TopCustomersOptions = {}) => {
      const { customerStatus, from: dateStart, to: dateEnd, limit = 10 } = options;

      const match: any = {};
      const { startDate, endDate } = resolveDateRange(dateStart, dateEnd);

      const orders = await modules.orders.findOrders(
        {
          status: [OrderStatus.CONFIRMED, OrderStatus.FULLFILLED],
          dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
        },
        {
          projection: {
            _id: 1,
          },
        },
      );

      const orderIds = orders.map(({ _id }) => _id);
      if (startDate) match.created = { ...(match.created || {}), $gte: startDate };
      if (endDate) match.created = { ...(match.created || {}), $lte: endDate };
      if (customerStatus) match.status = customerStatus;
      if (orderIds?.length) match._id = { $in: orderIds };

      const topCustomers = await modules.orders.aggregateOrders({
        match,
        project: {
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
        group: {
          _id: { userId: '$userId', currencyCode: '$currencyCode' },
          totalSpent: { $sum: '$itemAmount' },
          orderCount: { $sum: 1 },
          lastOrderDate: { $max: '$created' },
        },
        matchAfterGroup: {
          totalSpent: { $gt: 0 },
        },
        addFields: {
          averageOrderValue: {
            $cond: [{ $eq: ['$orderCount', 0] }, 0, { $divide: ['$totalSpent', '$orderCount'] }],
          },
          currencyCode: '$_id.currencyCode',
          _id: '$_id.userId',
        },

        sort: { totalSpent: -1 },
        limit,
      });

      const normalizedCustomers = await Promise.all(
        topCustomers.map(async (c) => {
          const user = await modules.users.findUserById(c._id);
          const avatar = await loaders.fileLoader.load({
            fileId: user?.avatarId,
          });
          return {
            userId: c._id?.toString?.() ?? null,
            user: {
              ...user,
              avatar,
            },
            currencyCode: c?.currencyCode || null,
            totalSpent: c?.totalSpent,
            orderCount: c?.orderCount,
            lastOrderDate: c.lastOrderDate,
            averageOrderValue: Math.round(c?.averageOrderValue),
          };
        }),
      );

      return { customers: normalizedCustomers };
    },

    topProducts: async (options: TopProductsOptions = {}) => {
      const { from, to, limit = 10 } = options;

      const match: any = {};
      const { startDate, endDate } = resolveDateRange(from, to);

      const orders = await modules.orders.findOrders(
        {
          status: [OrderStatus.CONFIRMED, OrderStatus.FULLFILLED],
          dateRange: { start: startDate.toISOString(), end: endDate.toISOString() },
        },
        {
          projection: {
            _id: 1,
          },
        },
      );
      const orderIds = orders.map(({ _id }) => _id);

      if (startDate) match.created = { ...(match.created || {}), $gte: startDate };
      if (endDate) match.created = { ...(match.created || {}), $lte: endDate };
      if (orderIds?.length) match.orderId = { $in: orderIds };

      const topProducts = await modules.orders.positions.aggregatePositions({
        match,
        project: {
          productId: 1,
          quantity: 1,
          itemAmount: {
            $let: {
              vars: {
                item: {
                  $first: {
                    $filter: {
                      input: '$calculation',
                      as: 'c',
                      cond: { $eq: ['$$c.category', 'ITEM'] },
                    },
                  },
                },
              },
              in: '$$item.amount',
            },
          },
        },
        group: {
          _id: '$productId',
          totalSold: { $sum: '$quantity' },
          totalRevenue: { $sum: '$itemAmount' },
        },
        matchAfterGroup: {
          totalSold: { $gt: 0 },
        },
        sort: { totalSold: -1 },
        limit,
      });

      const normalizedTopSellingProducts = await Promise.all(
        topProducts.map(async (p) => {
          const product = await getNormalizedProductDetails(p._id, context);
          return {
            productId: p._id?.toString?.() ?? null,
            product,
            totalSold: p.totalSold,
            totalRevenue: p.totalRevenue,
          };
        }),
      );

      return {
        products: normalizedTopSellingProducts,
        dateRange: {
          start: from ? new Date(from).toISOString() : null,
          end: to ? new Date(to).toISOString() : null,
        },
      };
    },
  };
};

export type OrderMcpModule = ReturnType<typeof configureOrderMcpModule>;
