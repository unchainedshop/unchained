import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import CopilotProductListItem from './CopilotProductListItem';
import ProductListItemCompact from './ProductListItemCompact';
import ListViewWrapper from '../ListViewWrapper';

interface ProductListProps {
  products: any[];
}

const CopilotProductList: React.FC<ProductListProps> = ({ products }) => {
  const { formatMessage } = useIntl();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredProducts =
    statusFilter === 'ALL'
      ? products
      : products.filter(
          (p) =>
            p.status === statusFilter ||
            (statusFilter === 'DRAFT' && !p.status),
        );

  const availableStatuses = [
    ...new Set(products.map((p) => (p.status ? p.status : 'DRAFT'))),
  ].filter(Boolean);

  return (
    <div>
      {availableStatuses.length > 1 && (
        <div className="flex gap-2">
          <div
            className={`px-3 py-1 text-sm rounded-md transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200`}
          >
            {formatMessage({ id: 'all', defaultMessage: 'All' })} (
            {products.length})
          </div>
          {availableStatuses.map((status) => {
            const count = products.filter(
              (p) => p.status === status || (status === 'DRAFT' && !p.status),
            ).length;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  statusFilter === status
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {status} ({count})
              </button>
            );
          })}
        </div>
      )}
      <ListViewWrapper>
        {(viewMode) =>
          viewMode === 'grid' ? (
            <div
              className="gap-4 max-w-full overflow-hidden"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gridTemplateRows: 'span 6',
              }}
            >
              {filteredProducts.map((product) => (
                <CopilotProductListItem key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-w-full overflow-hidden">
              {filteredProducts.map((product) => (
                <ProductListItemCompact key={product._id} product={product} />
              ))}
            </div>
          )
        }
      </ListViewWrapper>
    </div>
  );
};

export default CopilotProductList;
