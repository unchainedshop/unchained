import React from 'react';
import { useIntl } from 'react-intl';

interface ProductResultsSummaryProps {
  products: any[];
  requestedFilters?: any;
}

const ProductResultsSummary: React.FC<ProductResultsSummaryProps> = ({
  products,
  requestedFilters,
}) => {
  const { formatMessage } = useIntl();

  // Group products by status

  const statusGroups = products.reduce((acc, product) => {
    const status = product.status || 'DRAFT';
    if (!acc[status]) acc[status] = 0;
    acc[status]++;
    return acc;
  }, {});

  const totalCount = products.length;
  const draftCount = statusGroups['DRAFT'] || 0;
  const activeCount = statusGroups['ACTIVE'] || 0;

  return (
    <div className="my-4 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {formatMessage(
            { id: 'products_found', defaultMessage: '{count} products found' },
            { count: totalCount },
          )}
        </h4>
        {requestedFilters?.status && (
          <span className="text-xs text-slate-600 dark:text-slate-400">
            Filter: {requestedFilters.status}
          </span>
        )}
      </div>

      <div className="flex gap-4 text-sm">
        {draftCount > 0 && (
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            <span className="text-slate-600 dark:text-slate-400">
              {draftCount}{' '}
              {formatMessage({ id: 'draft', defaultMessage: 'Draft' })}
            </span>
          </div>
        )}
        {activeCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <span className="text-slate-600 dark:text-slate-400">
              {activeCount}{' '}
              {formatMessage({ id: 'active', defaultMessage: 'Active' })}
            </span>
          </div>
        )}
        {Object.entries(statusGroups).map(([status, count]) => {
          if (status === 'DRAFT' || status === 'ACTIVE') return null;
          return (
            <div key={status} className="flex items-center gap-1">
              <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
              <span className="text-slate-600 dark:text-slate-400">
                {totalCount} {status}
              </span>
            </div>
          );
        })}
      </div>

      {requestedFilters?.status && !statusGroups[requestedFilters.status] && (
        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          {formatMessage(
            {
              id: 'products_not_found',
              defaultMessage: 'No {status} products found in these results',
            },
            { status: requestedFilters.status },
          )}
        </div>
      )}
    </div>
  );
};

export default ProductResultsSummary;
