import { useMemo } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { format, parseISO, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  IOrderAnalyticsQuery,
  IOrderAnalyticsQueryVariables,
} from '../../../gql/types';

const ORDER_ANALYTICS_QUERY = gql`
  query OrderAnalytics($dateRange: DateFilterInput) {
    orderStatistics(dateRange: $dateRange) {
      confirmRecords {
        date
        total {
          amount
          currencyCode
        }
        count
      }
      confirmCount
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

const useOrderAnalytics = ({
  days = 30,
}: {
  days?: number;
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
    IOrderAnalyticsQuery,
    IOrderAnalyticsQueryVariables
  >(ORDER_ANALYTICS_QUERY, {
    variables: { dateRange },
    errorPolicy: 'all',
  });

  return useMemo(() => {
    const stats = data?.orderStatistics;
    if (!data?.orderStatistics?.confirmCount) {
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

    const dailySales = initializeDailySales(days, endDate);
    let totalSales = 0;
    const currencyCode = stats.confirmRecords[0]?.total?.currencyCode;
    stats.confirmRecords.forEach((record) => {
      if (!record.date || !record.total?.amount || !record.count) return;
      const date = format(parseISO(record.date), 'MMM d');
      const daily = dailySales.get(date);
      const amount = Number(record.total.amount ?? 0);
      const count = record.count ?? 0;

      if (daily) {
        daily.sales += amount;
        daily.orders += count;
      }
      totalSales += amount;
    });

    const totalOrders = stats.confirmCount;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
      totalSales: Math.round(totalSales),
      totalOrders,
      currencyCode,
      averageOrderValue: Math.round(averageOrderValue),
      salesData: buildSalesData(dailySales),
      loading,
      error,
      dateRange,
    };
  }, [data, loading, error, dateRange, days, endDate]);
};

export default useOrderAnalytics;
