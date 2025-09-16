import React from 'react';
import { useIntl } from 'react-intl';

interface VariationListItemCompactProps {
  variation: {
    _id: string;
    created: string;
    type: string;
    options: string[];
    productId: string;
    key: string;
    updated: string;
  };
}

const VariationListItemCompact: React.FC<VariationListItemCompactProps> = ({
  variation,
}) => {
  const { formatMessage } = useIntl();

  return (
    <div className="flex items-center gap-4 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-200 w-full overflow-hidden">
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
          {variation.key ||
            formatMessage({
              id: 'variation.untitled',
              defaultMessage: 'Untitled Variation',
            })}
        </h3>
        <div className="flex items-center gap-3 mt-1 text-xs">
          <span className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-600 px-2 py-0.5 rounded">
            {variation.type}
          </span>
          <span className="text-slate-400 truncate">
            {formatMessage({ id: 'variation.id', defaultMessage: 'ID' })}:{' '}
            {variation._id}
          </span>
        </div>
      </div>

      {/* Middle: Options */}
      <div className="flex flex-wrap gap-2 max-w-[40%]">
        {variation.options?.map((option, idx) => (
          <span
            key={idx}
            className="inline-block px-2 py-1 text-xs font-medium text-green-700 bg-green-100 dark:bg-green-800 dark:text-green-200 rounded"
          >
            {option}
          </span>
        ))}
      </div>

      {/* Right: Metadata */}
      <div className="flex flex-col items-end text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
        <span>
          {formatMessage({
            id: 'variation.productId',
            defaultMessage: 'Product ID',
          })}
          : {variation.productId}
        </span>
        <span>
          {formatMessage({
            id: 'variation.created',
            defaultMessage: 'Created',
          })}
          : {new Date(variation.created).toLocaleString()}
        </span>
        <span>
          {formatMessage({
            id: 'variation.updated',
            defaultMessage: 'Updated',
          })}
          : {new Date(variation.updated).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default VariationListItemCompact;
