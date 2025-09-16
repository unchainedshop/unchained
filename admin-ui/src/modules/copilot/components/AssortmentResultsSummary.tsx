import React from 'react';
import { useIntl } from 'react-intl';
import classNames from 'classnames';
import {
  FolderIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface AssortmentResultsSummaryProps {
  assortments: any[];
  requestedFilters?: any;
  className?: string;
}

const AssortmentResultsSummary: React.FC<AssortmentResultsSummaryProps> = ({
  assortments,
  requestedFilters,
  className,
}) => {
  const { formatMessage } = useIntl();

  // Calculate statistics
  const stats = {
    total: assortments.length,
    active: assortments.filter((a) => a.isActive).length,
    inactive: assortments.filter((a) => a.isActive === false).length,
    withChildren: assortments.filter((a) => a.childrenCount > 0).length,
    roots: assortments.filter((a) => a.isRoot).length,
  };

  const getStatusIndicator = (count: number, type: 'active' | 'inactive') => {
    const isActive = type === 'active';
    return (
      <div className="flex items-center gap-2">
        <div
          className={classNames(
            'w-2 h-2 rounded-full',
            isActive ? 'bg-emerald-500' : 'bg-slate-400',
          )}
        />
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {isActive ? (
            <span className="flex items-center gap-1">
              <EyeIcon className="w-4 h-4" />
              {formatMessage({ id: 'active', defaultMessage: 'Active' })}:{' '}
              {count}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <EyeSlashIcon className="w-4 h-4" />
              {formatMessage({
                id: 'inactive',
                defaultMessage: 'In-Active',
              })}
              : {count}
            </span>
          )}
        </span>
      </div>
    );
  };

  return (
    <div
      className={classNames(
        'dark:bg-slate-900 rounded-lg border-1 dark:border-slate-700 p-4 my-5',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <FolderIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        <h3 className="font-medium text-slate-900 dark:text-slate-100">
          {formatMessage({
            id: 'assortment_search_results',
            defaultMessage: 'Assortment Search Results',
          })}
        </h3>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {stats.total}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-500">
            {formatMessage({ id: 'total', defaultMessage: 'Total' })}
          </div>
        </div>

        <div className="text-center">
          <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            {stats.active}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-500">
            {formatMessage({ id: 'active', defaultMessage: 'Active' })}
          </div>
        </div>

        <div className="text-center">
          <div className="text-lg font-semibold text-slate-600 dark:text-slate-400">
            {stats.inactive}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-500">
            {formatMessage({ id: 'inactive', defaultMessage: 'In-Active' })}
          </div>
        </div>

        <div className="text-center">
          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {stats.withChildren}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-500">
            {formatMessage({
              id: 'with_children',
              defaultMessage: 'With Children',
            })}
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {getStatusIndicator(stats.active, 'active')}
          {getStatusIndicator(stats.inactive, 'inactive')}
        </div>

        {/* Filters Info */}
        {requestedFilters && (
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
            <InformationCircleIcon className="w-4 h-4" />
            {formatMessage({
              id: 'filtered_results',
              defaultMessage: 'Filtered results',
            })}
          </div>
        )}
      </div>

      {/* Additional Info */}
      {stats.roots > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {formatMessage(
              {
                id: 'root_assortments_count',
                defaultMessage: '{count} root assortments found',
              },
              { count: stats.roots },
            )}
          </div>
        </div>
      )}

      {/* Empty State Message */}
      {stats.total === 0 && (
        <div className="text-center py-4">
          <div className="text-slate-500 dark:text-slate-400">
            {formatMessage({
              id: 'no_assortments_found',
              defaultMessage: 'No assortments found matching your criteria',
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssortmentResultsSummary;
