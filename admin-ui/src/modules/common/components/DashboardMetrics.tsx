import React from 'react';
import { useIntl } from 'react-intl';
import {
  CubeIcon,
  UsersIcon,
  RectangleStackIcon,
} from '@heroicons/react/20/solid';
import MetricCard from './MetricCard';
import useDashboardMetrics from '../hooks/useDashboardMetrics';

const DashboardMetrics: React.FC = () => {
  const { formatMessage } = useIntl();
  const { metrics } = useDashboardMetrics();

  const metricCards = [
    {
      title: formatMessage({
        id: 'products_count',
        defaultMessage: 'Products',
      }),
      value: metrics.products.value,
      icon: <CubeIcon className="h-6 w-6 text-slate-700 dark:text-slate-300" />,
      loading: metrics.products.loading,
      href: '/products',
    },
    {
      title: formatMessage({
        id: 'categories_count',
        defaultMessage: 'Assortments',
      }),
      value: metrics.categories.value,
      icon: (
        <RectangleStackIcon className="h-6 w-6 text-slate-700 dark:text-slate-300" />
      ),
      loading: metrics.categories.loading,
      href: '/assortments',
    },
    {
      title: formatMessage({
        id: 'customers_count',
        defaultMessage: 'Customers',
      }),
      value: metrics.customers.value,
      icon: (
        <UsersIcon className="h-6 w-6 text-slate-700 dark:text-slate-300" />
      ),
      loading: metrics.customers.loading,
      href: '/users',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {metricCards.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          icon={metric.icon}
          loading={metric.loading}
          href={metric.href}
        />
      ))}
    </div>
  );
};

export default DashboardMetrics;
