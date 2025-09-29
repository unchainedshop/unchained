import React from 'react';

import { useIntl } from 'react-intl';
import Link from 'next/link';
import ImageWithFallback from '../../../common/components/ImageWithFallback';
import generateUniqueId from '../../../common/utils/getUniqueId';
import { useFormatPrice } from '../../../common/utils/utils';

const AssignmentListCompact = ({ assignments }) => {
  const { formatMessage } = useIntl();
  const { formatPrice } = useFormatPrice();
  if (!assignments?.length) return null;

  return (
    <div className="space-y-4">
      {assignments.map(({ assignment }, idx) => {
        const assignedProduct = assignment?.product;
        const price = formatPrice(assignedProduct?.commerce?.pricing?.[0]);
        const image = assignedProduct?.media?.[0]?.file?.url;
        return (
          <div
            key={idx}
            className="flex gap-4 items-center border rounded-xl p-3 shadow-sm bg-white dark:bg-slate-900"
          >
            <ImageWithFallback
              src={image}
              alt="Product image"
              width={60}
              height={60}
              className="rounded-md object-cover"
            />

            <div className="flex-1 space-y-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {assignedProduct?.texts?.title}{' '}
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(assignment.vector).map(([key, value]: any) => (
                  <span
                    key={key}
                    className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white px-2 py-0.5 rounded"
                  >
                    {key}: {value}
                  </span>
                ))}
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                {assignedProduct?.type?.replace('_PRODUCT', '')} ·{' '}
                {assignedProduct?.warehousing?.sku &&
                  formatMessage({ id: 'sku', defaultMessage: 'SKU' })}
                {': '}
                {assignedProduct?.warehousing?.sku}{' '}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {formatMessage({ id: 'id', defaultMessage: 'ID' })}:{' '}
                {assignedProduct?._id}
              </span>
            </div>

            {price && (
              <div className="text-right text-sm font-semibold text-slate-900 dark:text-white min-w-[80px]">
                {price}
              </div>
            )}
            {assignedProduct && (
              <div className="ml-4">
                <Link
                  href={`/products?slug=${generateUniqueId(assignedProduct)}`}
                  className="text-sm px-3 py-1 rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-white"
                >
                  {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AssignmentListCompact;
