import Link from 'next/link';
import React from 'react';
import { useIntl } from 'react-intl';
import generateUniqueId from '../../../common/utils/getUniqueId';

interface AssignmentListItemCompactProps {
  product?: {
    _id: string;
    texts?: {
      title?: string;
      subtitle?: string;
      brand?: string;
    };
    warehousing?: {
      sku?: string;
    };
    tags?: string[];
    pricing?: {
      amount: number;
      currencyCode: string;
    };
  };
  vectors: { key: string; value: string }[];
}

const AssignmentListItemCompact: React.FC<AssignmentListItemCompactProps> = ({
  product,
  vectors,
}) => {
  const { formatMessage } = useIntl();

  const title =
    product?.texts?.title ||
    formatMessage({
      id: 'assignment.title',
      defaultMessage: 'Product Assignment',
    });
  const subtitle = product?.texts?.subtitle || '';
  const brand = product?.texts?.brand || '';
  const sku = product?.warehousing?.sku || '';
  const tags = product?.tags || [];
  const price = product?.pricing?.amount;
  const currency = product?.pricing?.currencyCode;

  return (
    <div className="relative flex items-start gap-4 p-3 bg-surface rounded-lg shadow-sm border border-border-subtle hover:shadow-md transition-shadow duration-200 w-full overflow-hidden">
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-text-primary truncate">
          {title}
        </h3>

        {(subtitle || brand) && (
          <p className="text-xs text-text-secondary truncate">
            {brand && <span className="font-semibold">{brand}</span>}
            {brand && subtitle ? ' — ' : ''}
            {subtitle}
          </p>
        )}

        {sku && (
          <p className="text-xs text-text-muted mt-0.5">
            {formatMessage({ id: 'assignment_sku', defaultMessage: 'SKU' })}:{' '}
            {sku}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 text-[10px] font-medium bg-surface-raised text-text-secondary rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {price !== undefined && currency && (
          <p className="text-xs font-semibold text-text-primary mt-1">
            {(price / 100).toFixed(2)} {currency}
          </p>
        )}
      </div>

      {vectors?.length > 0 && (
        <div className="flex flex-col items-end gap-1 max-w-[40%]">
          <div className="flex flex-wrap gap-1 justify-end">
            {vectors.map((vector, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-blue-700 bg-blue-100 dark:bg-blue-800 dark:text-blue-200 rounded"
              >
                {vector.key}: {vector.value}
              </span>
            ))}
          </div>
          <Link
            href={`/products?slug=${generateUniqueId(product)}`}
            className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary border border-border-default rounded-md hover:bg-surface-raised transition-colors flex-shrink-0"
          >
            {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
          </Link>
        </div>
      )}
    </div>
  );
};

export default AssignmentListItemCompact;
