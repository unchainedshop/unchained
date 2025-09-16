import React, { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Euro,
  ShoppingCart,
  Calculator,
  ArrowRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../../../components/ui/chart';
import useRealAnalytics from '../hooks/useRealAnalytics';
import useOrderItemsAnalytics from '../hooks/useOrderItemsAnalytics';
import useShopInfo from '../hooks/useShopInfo';
import generateUniqueId from '../utils/getUniqueId';

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

const SimpleDashboard: React.FC = () => {
  const { formatMessage, locale } = useIntl();
  const { analytics, loading, error } = useRealAnalytics();
  const {
    topProducts: realTopProducts,
    loading: productsLoading,
    error: productsError,
  } = useOrderItemsAnalytics();
  const { shopInfo } = useShopInfo();
  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    if (!loading && !productsLoading) {
      // Start bar animation after data loads
      const timer = setTimeout(() => setAnimateBars(true), 100);
      return () => clearTimeout(timer);
    }
  }, [loading, productsLoading]);

  if (loading) {
    return (
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
          {[...Array(3)].map((_, i) => (
            <Card
              key={i}
              className="relative overflow-hidden rounded-xl border-0 bg-white"
            >
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
                <div className="h-10 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-2" />
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-2" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-49 relative overflow-hidden rounded">
                  {/* Chart-like skeleton with gradient and curved shape */}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 animate-pulse" />
                  <svg
                    className="w-full h-full opacity-30"
                    viewBox="0 0 100 40"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id="skeleton-gradient"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor="currentColor"
                          stopOpacity="0.3"
                        />
                        <stop
                          offset="100%"
                          stopColor="currentColor"
                          stopOpacity="0.05"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,30 Q20,20 40,25 T80,15 L100,18 L100,40 L0,40 Z"
                      fill="url(#skeleton-gradient)"
                      className="text-slate-400 dark:text-slate-500"
                    />
                    <path
                      d="M0,30 Q20,20 40,25 T80,15 L100,18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-slate-400 dark:text-slate-500"
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Top Selling Products Loading */}
        <Card className="mb-8 relative overflow-hidden rounded-xl border-0 bg-white dark:bg-slate-800">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="h-4 w-56 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between min-h-[2rem]"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-md animate-pulse" />
                    <div className="h-4 w-32 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-slate-100 dark:bg-slate-700 rounded-full animate-pulse" />
                    <div className="h-4 w-6 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        <Card className="col-span-2">
          <CardContent className="p-6">
            <p className="text-rose-600 dark:text-rose-400">
              Error loading analytics: {error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    totalSales,
    totalOrders,
    averageOrderValue,
    currency,
    salesGrowth,
    ordersGrowth,
    avgOrderValueGrowth,
    topProducts,
    salesData,
  } = analytics;

  // Use shop's default currency if available, fallback to order currency or EUR
  const displayCurrency =
    shopInfo?.country?.defaultCurrency?.isoCode || currency || 'EUR';

  // Use real top products if available, fallback to analytics mock data
  const displayTopProducts: any =
    realTopProducts.length > 0 ? realTopProducts : topProducts;

  // Custom formatter for currency values in tooltips
  const formatCurrency = (value) =>
    `${displayCurrency} ${Math.round(value).toLocaleString(locale || 'en-US')}`;

  // Custom formatter for count values in tooltips
  const formatCount = (value) =>
    Math.round(value).toLocaleString(locale || 'en-US');

  // Show no orders state if there are no orders
  if (totalOrders === 0) {
    return (
      <div className="my-10">
        <ShoppingCart className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-6" />
        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-3">
          {formatMessage({
            id: 'no_orders_title',
            defaultMessage: 'No orders yet',
          })}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md text-lg">
          {formatMessage({
            id: 'no_orders_description',
            defaultMessage:
              'Once you receive your first orders, your sales analytics and top-selling products will appear here.',
          })}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
        {/* Total Sales Chart */}
        <Card className="relative overflow-hidden rounded-xl border-0 bg-white">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardDescription className="text-slate-500 font-medium">
                {formatMessage({
                  id: 'total_sales',
                  defaultMessage: 'Total sales',
                })}{' '}
                {new Date().toLocaleDateString(locale || 'en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </CardDescription>
            </div>
            <CardTitle className="text-4xl font-bold text-slate-900 mt-2">
              {displayCurrency}{' '}
              {Math.round(totalSales).toLocaleString(locale || 'en-US')}
            </CardTitle>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp
                className={`h-4 w-4 ${salesGrowth >= 0 ? 'text-green-500' : 'text-rose-500'}`}
              />
              <span
                className={`text-sm font-medium ${salesGrowth >= 0 ? 'text-green-500' : 'text-rose-500'}`}
              >
                {salesGrowth >= 0 ? '+' : ''}
                {salesGrowth.toFixed(1)}%{' '}
                {formatMessage({
                  id: 'from_last_month',
                  defaultMessage: 'from last month',
                })}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={chartConfig}>
              <AreaChart
                accessibilityLayer
                data={salesData}
                margin={{
                  left: 12,
                  right: 12,
                  bottom: 12,
                  top: 12,
                }}
              >
                <defs>
                  <linearGradient
                    id="salesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(value) => value.slice(0, 6)}
                />
                <YAxis hide />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent hideLabel formatter={formatCurrency} />
                  }
                />
                <Area
                  dataKey="sales"
                  type="natural"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#salesGradient)"
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Total Orders Chart */}
        <Card className="relative overflow-hidden rounded-xl border-0 bg-white">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardDescription className="text-slate-500 font-medium">
                {formatMessage({
                  id: 'total_orders',
                  defaultMessage: 'Total orders',
                })}{' '}
                {new Date().toLocaleDateString(locale || 'en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </CardDescription>
            </div>
            <CardTitle className="text-4xl font-bold text-slate-900 mt-2">
              {totalOrders.toLocaleString(locale || 'en-US')}
            </CardTitle>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp
                className={`h-4 w-4 ${ordersGrowth >= 0 ? 'text-green-500' : 'text-rose-500'}`}
              />
              <span
                className={`text-sm font-medium ${ordersGrowth >= 0 ? 'text-green-500' : 'text-rose-500'}`}
              >
                {ordersGrowth >= 0 ? '+' : ''}
                {ordersGrowth.toFixed(1)}%{' '}
                {formatMessage({
                  id: 'from_last_month',
                  defaultMessage: 'from last month',
                })}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={chartConfig}>
              <AreaChart
                accessibilityLayer
                data={salesData}
                margin={{
                  left: 12,
                  right: 12,
                  bottom: 12,
                  top: 12,
                }}
              >
                <defs>
                  <linearGradient
                    id="ordersGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(value) => value.slice(0, 6)}
                />
                <YAxis hide />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent hideLabel formatter={formatCount} />
                  }
                />
                <Area
                  dataKey="orders"
                  type="natural"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#ordersGradient)"
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Average Order Value Chart */}
        <Card className="relative overflow-hidden rounded-xl border-0 bg-white">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardDescription className="text-slate-500 font-medium">
                {formatMessage({
                  id: 'average_order_value',
                  defaultMessage: 'Average order value',
                })}{' '}
                {new Date().toLocaleDateString(locale || 'en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </CardDescription>
            </div>
            <CardTitle className="text-4xl font-bold text-slate-900 mt-2">
              {displayCurrency}{' '}
              {Math.round(averageOrderValue).toLocaleString(locale || 'en-US')}
            </CardTitle>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp
                className={`h-4 w-4 ${avgOrderValueGrowth >= 0 ? 'text-green-500' : 'text-rose-500'}`}
              />
              <span
                className={`text-sm font-medium ${avgOrderValueGrowth >= 0 ? 'text-green-500' : 'text-rose-500'}`}
              >
                {avgOrderValueGrowth >= 0 ? '+' : ''}
                {avgOrderValueGrowth.toFixed(1)}%{' '}
                {formatMessage({
                  id: 'from_last_month',
                  defaultMessage: 'from last month',
                })}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer config={chartConfig}>
              <AreaChart
                accessibilityLayer
                data={salesData}
                margin={{
                  left: 12,
                  right: 12,
                  bottom: 12,
                  top: 12,
                }}
              >
                <defs>
                  <linearGradient
                    id="avgOrderGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(value) => value.slice(0, 6)}
                />
                <YAxis hide />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent hideLabel formatter={formatCurrency} />
                  }
                />
                <Area
                  dataKey="avgOrderValue"
                  type="natural"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fill="url(#avgOrderGradient)"
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      {/* Top Selling Products */}
      <Card className="mb-8 relative overflow-hidden rounded-xl border-0 bg-white dark:bg-slate-800">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardDescription className="text-slate-500 dark:text-slate-400 font-medium">
              {formatMessage({
                id: 'top_selling_products',
                defaultMessage: 'Top selling products',
              })}{' '}
              {new Date().toLocaleDateString('de-CH', {
                month: 'long',
                year: 'numeric',
              })}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-6">
          {productsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 w-40 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
                  <div className="h-4 w-12 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          ) : productsError && !realTopProducts.length ? (
            <div className="text-center py-8">
              <span className="text-slate-400 dark:text-slate-500 text-sm">
                {formatMessage({
                  id: 'products_data_unavailable',
                  defaultMessage: 'Product data unavailable',
                })}
              </span>
            </div>
          ) : displayTopProducts.length > 0 ? (
            <div className="space-y-4">
              {displayTopProducts.map((product, index) => (
                <div
                  key={product.productId || index}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {product.productImage && (
                      <img
                        src={product.productImage}
                        alt={product.productName}
                        className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                      />
                    )}
                    <a
                      href={
                        product.product
                          ? `/products?slug=${generateUniqueId(product.product)}`
                          : `/products`
                      }
                      className="group flex items-center gap-1 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 text-sm font-medium transition-colors"
                    >
                      <span className="truncate">
                        {product.productName || `Product ${index + 1}`}
                      </span>
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out flex-shrink-0" />
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-slate-700 dark:bg-slate-300 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: animateBars
                            ? `${Math.min((product.totalQuantity / (displayTopProducts[0]?.totalQuantity || 1)) * 100, 100)}%`
                            : '0%',
                          transitionDelay: `${index * 150}ms`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 w-8 text-right">
                      {product.totalQuantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex flex-col items-center">
                <ShoppingCart className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
                  {formatMessage({
                    id: 'no_orders_title',
                    defaultMessage: 'No orders yet',
                  })}
                </h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm">
                  {formatMessage({
                    id: 'no_order_products_description',
                    defaultMessage:
                      'Once you receive your first orders, your top-selling products will appear here.',
                  })}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleDashboard;
