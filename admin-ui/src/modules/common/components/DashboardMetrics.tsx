import React from 'react';
import { useIntl } from 'react-intl';
import { IRoleAction } from '../../../gql/types';
import {
  CubeIcon,
  UsersIcon,
  RectangleStackIcon,
} from '@heroicons/react/20/solid';
import MetricCard from './MetricCard';
import useDashboardMetrics from '../hooks/useDashboardMetrics';
import useAuth from '../../Auth/useAuth';

const DashboardMetrics: React.FC = () => {
  const { formatMessage } = useIntl();
  const { metrics } = useDashboardMetrics();
  const { hasRole } = useAuth();

  const metricCards = [
    hasRole(IRoleAction.ViewProducts) && {
      title: formatMessage({
        id: 'products_count',
        defaultMessage: 'Products',
      }),
      value: metrics.products.value,
      icon: <CubeIcon className="h-6 w-6 text-text-secondary" />,
      loading: metrics.products.loading,
      href: '/products',
    },
    hasRole(IRoleAction.ViewAssortments) && {
      title: formatMessage({
        id: 'categories_count',
        defaultMessage: 'Assortments',
      }),
      value: metrics.categories.value,
      icon: <RectangleStackIcon className="h-6 w-6 text-text-secondary" />,
      loading: metrics.categories.loading,
      href: '/assortments',
    },
    hasRole(IRoleAction.ViewUsers) && {
      title: formatMessage({
        id: 'customers_count',
        defaultMessage: 'Customers',
      }),
      value: metrics.customers.value,
      icon: <UsersIcon className="h-6 w-6 text-text-secondary" />,
      loading: metrics.customers.loading,
      href: '/users',
    },
  ].filter(Boolean);

  if (metricCards.length === 0) return null;

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
