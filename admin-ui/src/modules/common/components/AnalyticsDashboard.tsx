import React from 'react';
import { useIntl } from 'react-intl';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  ShoppingCart,
  Calculator,
  CurrencyIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../../../components/ui/chart';
import useSalesAnalytics from '../hooks/useSalesAnalytics';
import { useFormatPrice } from '../utils/utils';
import MetricGraphCard from './MetricGraphCard';

const chartConfig = {
  sales: {
    label: 'Sales',
    color: 'hsl(var(--chart-1))',
  },
  orders: {
    label: 'Orders',
    color: 'hsl(var(--chart-2))',
  },
  avgOrderValue: {
    label: 'Avg Order Value',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

const AnalyticsDashboard: React.FC = () => {
  const { formatMessage } = useIntl();
  const {
    dateRange,
    totalSales,
    totalOrders,
    averageOrderValue,
    salesData,
    loading,
    currencyCode,
  } = useSalesAnalytics({ days: 30 });
  const { formatPrice } = useFormatPrice();
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
      <MetricGraphCard
        icon={<CurrencyIcon className="h-4 w-4" />}
        title={formatMessage({
          id: 'total_sales',
          defaultMessage: 'Total sales',
        })}
        value={formatPrice({ currencyCode, amount: totalSales })}
        chart={
          <ChartContainer config={chartConfig}>
            <LineChart
              accessibilityLayer
              data={salesData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 6)}
              />
              <YAxis hide />
              <ChartTooltip
                wrapperStyle={{ pointerEvents: 'auto', zIndex: 50 }}
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) =>
                      formatPrice({ currencyCode, amount: value })
                    }
                  />
                }
              />
              <Line
                dataKey="sales"
                type="natural"
                stroke="var(--color-sales)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        }
        dateRange={dateRange}
      />

      {/* Total Orders Chart */}

      <MetricGraphCard
        icon={<ShoppingCart className="h-4 w-4" />}
        title={formatMessage({
          id: 'total_orders',
          defaultMessage: 'Total orders',
        })}
        value={totalOrders}
        chart={
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={salesData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="orders" fill="var(--color-orders)" radius={4} />
            </BarChart>
          </ChartContainer>
        }
        dateRange={dateRange}
      />

      {/* Average Order Value Chart */}

      <MetricGraphCard
        icon={<Calculator className="h-4 w-4" />}
        title={formatMessage({
          id: 'average_order_value',
          defaultMessage: 'Average order value',
        })}
        value={formatPrice({ amount: averageOrderValue, currencyCode })}
        chart={
          <ChartContainer config={chartConfig}>
            <LineChart
              accessibilityLayer
              data={salesData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 6)}
              />
              <YAxis hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value) =>
                      formatPrice({ currencyCode, amount: value })
                    }
                  />
                }
              />
              <Line
                dataKey="avgOrderValue"
                type="natural"
                stroke="var(--color-avgOrderValue)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        }
        dateRange={dateRange}
      />
    </div>
  );
};

export default AnalyticsDashboard;
