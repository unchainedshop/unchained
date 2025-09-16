import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '../../../../components/ui/chart';
import MetricGraphCard from '../../../common/components/MetricGraphCard';
import { CalculatorIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useIntl } from 'react-intl';
import { useFormatPrice } from '../../../common/utils/utils';
import { CurrencyIcon } from 'lucide-react';

const SalesSummeryReport = ({
  currencyCode,
  orderCount,
  averageOrderValue,
  summary = [],
  totalSalesAmount,
  dateRange,
}) => {
  const { formatMessage } = useIntl();
  const { formatPrice } = useFormatPrice();

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
      <MetricGraphCard
        icon={<CurrencyIcon className="h-4 w-4" />}
        title={formatMessage({
          id: 'total_sales',
          defaultMessage: 'Total sales',
        })}
        value={formatPrice({ currencyCode, amount: totalSalesAmount })}
        chart={
          <ChartContainer config={chartConfig}>
            <LineChart
              accessibilityLayer
              data={summary}
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

      <MetricGraphCard
        icon={<ShoppingCartIcon className="h-4 w-4" />}
        title={formatMessage({
          id: 'total_orders',
          defaultMessage: 'Total orders',
        })}
        value={orderCount}
        chart={
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={summary}
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
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="orders" fill="var(--color-orders)" radius={4} />
            </BarChart>
          </ChartContainer>
        }
        dateRange={dateRange}
      />

      <MetricGraphCard
        icon={<CalculatorIcon className="h-4 w-4" />}
        title={formatMessage({
          id: 'average_order_value',
          defaultMessage: 'Average order value',
        })}
        value={formatPrice({ amount: averageOrderValue, currencyCode })}
        chart={
          <ChartContainer config={chartConfig}>
            <LineChart
              accessibilityLayer
              data={summary}
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

export default SalesSummeryReport;
