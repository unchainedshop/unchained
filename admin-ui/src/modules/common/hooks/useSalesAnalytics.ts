import { useMemo } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { format, parseISO, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  IOrderStatus,
  ISalesAnalyticsQuery,
  ISalesAnalyticsQueryVariables,
} from '../../../gql/types';

const SALES_ANALYTICS_QUERY = gql`
  query SalesAnalytics(
    $includeCarts: Boolean = false
    $queryString: String
    $status: [OrderStatus!]
    $sort: [SortOptionInput!]
    $paymentProviderIds: [String!]
    $deliveryProviderIds: [String!]
    $dateRange: DateFilterInput
  ) {
    orders(
      limit: 0
      includeCarts: $includeCarts
      status: $status
      queryString: $queryString
      sort: $sort
      paymentProviderIds: $paymentProviderIds
      deliveryProviderIds: $deliveryProviderIds
      dateRange: $dateRange
    ) {
      _id
      ordered
      status
      total {
        amount
        currencyCode
      }
    }
  }
`;

export interface SalesData {
  date: string;
  sales: number;
  orders: number;
  avgOrderValue: number;
}

export interface SalesAnalyticsResult {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  salesData: SalesData[];
  loading: boolean;
  dateRange?: { start: string; end: string };
  currencyCode?: string;
  error: any;
}

interface Order {
  _id: string;
  ordered: string;
  status: string;
  total: { amount: number; currencyCode: string };
}

const initializeDailySales = (days: number, endDate: Date) => {
  const map = new Map<string, { sales: number; orders: number }>();
  for (let i = 0; i < days; i++) {
    const date = format(subDays(endDate, i), 'MMM d');
    map.set(date, { sales: 0, orders: 0 });
  }
  return map;
};

const buildSalesData = (
  dailySales: Map<string, { sales: number; orders: number }>,
): SalesData[] =>
  Array.from(dailySales.entries())
    .map(([date, { sales, orders }]) => ({
      date,
      sales: Number(sales.toFixed(2)),
      orders,
      avgOrderValue: orders > 0 ? Math.round(sales / orders) : 0,
    }))
    .reverse();

const useSalesAnalytics = ({
  days = 30,
  paymentProviderIds = [],
  deliveryProviderIds = [],
  queryString = '',
}: {
  days?: number;
  paymentProviderIds?: string[];
  deliveryProviderIds?: string[];
  queryString?: string;
}): SalesAnalyticsResult => {
  const endDate = useMemo(() => new Date(), []);
  const startDate = subDays(endDate, days);

  const dateRange = useMemo(
    () => ({
      start: startOfDay(startDate).toISOString(),
      end: endOfDay(endDate).toISOString(),
    }),
    [startDate, endDate],
  );

  const { data, loading, error } = useQuery<
    ISalesAnalyticsQuery,
    ISalesAnalyticsQueryVariables
  >(SALES_ANALYTICS_QUERY, {
    variables: {
      status: [IOrderStatus.Confirmed, IOrderStatus.Fullfilled],
      queryString,
      paymentProviderIds,
      deliveryProviderIds,
      dateRange,
    },
    errorPolicy: 'all',
  });

  return useMemo(() => {
    const orders = data?.orders || [];
    if (!orders.length) {
      return {
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        salesData: [],
        loading,
        error,
        dateRange,
      };
    }

    let totalSales = 0;
    const dailySales = initializeDailySales(days, endDate);
    orders.forEach((order) => {
      if (!order.ordered || order.total?.amount == null) return;

      const date = format(parseISO(order.ordered), 'MMM d');
      const daily = dailySales.get(date);

      const orderAmount = Number(order.total?.amount ?? 0);
      if (daily) {
        daily.sales += orderAmount;
        daily.orders += 1;
      }

      totalSales += orderAmount;
    });

    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
      totalSales: Math.round(totalSales),
      currencyCode: orders[0]?.total?.currencyCode ?? 'USD',
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue),
      salesData: buildSalesData(dailySales),
      loading,
      error,
      dateRange,
    };
  }, [data, loading, error, dateRange, days, endDate]);
};

export default useSalesAnalytics;
