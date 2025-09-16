import React from 'react';
import ProductItemWrapperCompact from './ProductItemWrapperCompact';

interface Variation {
  _id: string;
  type: string;
  key: string;
  productId: string;
  options: string[];
}

const VariationListCompact = ({
  variations,
  product,
}: {
  variations: Variation[];
  product?: any;
}) => {
  return (
    <ProductItemWrapperCompact product={product} tab="variations">
      <div className="text-sm space-y-2">
        {variations?.map(({ _id, type, key, options }) => (
          <div
            key={_id}
            className="flex items-center justify-between gap-4 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md"
          >
            <div>
              <div className="text-sm font-medium">{key || '—'}</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                {options?.join(', ') || '—'}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase">
                {type || '—'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ProductItemWrapperCompact>
  );
};

export default VariationListCompact;
