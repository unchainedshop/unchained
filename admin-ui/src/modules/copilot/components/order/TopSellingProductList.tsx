import React from 'react';
import Link from 'next/link';
import { useIntl } from 'react-intl';
import { useFormatPrice } from '../../../common/utils/utils';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import generateUniqueId from '../../../common/utils/getUniqueId';
import { ProductStatusBadge } from '../../../product/components/ProductStatusBadge';
import useFormatDateTime from '../../../common/utils/useFormatDateTime';
const TopSellingProductListItem = ({ product }) => {
  const intl = useIntl();
  const { formatPrice } = useFormatPrice();
  const { product: p, totalSold, totalRevenue, currencyCode } = product;
  const text = p.texts;
  const price = p.commerce?.pricing?.[0];
  const { formatMessage } = intl;

  return (
    <div className="flex items-center gap-4 p-3 bg-surface rounded-lg shadow-sm border border-border-subtle hover:shadow-md transition-shadow duration-200">
      <div className="w-16 h-16 flex-shrink-0 bg-surface rounded-md overflow-hidden">
        <ImageWithFallback
          src={p.media?.[0]?.file?.url}
          alt={text.title}
          className="w-full h-full object-cover"
          width={64}
          height={64}
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-text-primary truncate">
          {text.title ||
            formatMessage({
              id: 'product_untitled',
              defaultMessage: 'Untitled Product',
            })}
        </h3>
        <div className="flex items-center gap-3 mt-1">
          <ProductStatusBadge status={p?.status} />
          <span className="text-xs text-text-muted bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded">
            {(p.type || 'SIMPLE_PRODUCT').replace('_PRODUCT', '')}
          </span>
          <span className="text-sm font-medium text-text-primary">
            {price
              ? formatPrice(price)
              : formatMessage({
                  id: 'product_no_price',
                  defaultMessage: 'No price',
                })}
          </span>
          <span className="text-xs text-text-muted truncate">
            {formatMessage({ id: 'product_id', defaultMessage: 'ID' })}: {p._id}
          </span>
        </div>

        <div className="mt-1 text-xs text-text-muted">
          <span className="font-medium">
            {formatMessage({ id: 'product_sold', defaultMessage: 'Sold' })}:
          </span>{' '}
          {totalSold}
          <span className="mx-2">•</span>
          <span className="font-medium">
            {formatMessage({
              id: 'product_revenue',
              defaultMessage: 'Revenue',
            })}
            :
          </span>{' '}
          {formatPrice({
            amount: totalRevenue,
            currencyCode: currencyCode || price?.currencyCode,
          })}
        </div>
      </div>

      <Link
        href={`/products?slug=${generateUniqueId(p)}`}
        className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary border border-border-default rounded-md hover:bg-surface-raised transition-colors flex-shrink-0"
      >
        {formatMessage({ id: 'action_edit', defaultMessage: 'Edit' })}
      </Link>
    </div>
  );
};

const TopSellingProductList = ({ products, dateRange }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  if (!products?.length) {
    return (
      <div className="text-sm text-text-muted">
        {formatMessage({
          id: 'top_selling_no_products',
          defaultMessage: 'No top selling products found.',
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(dateRange?.start || dateRange?.end) && (
        <div className="text-sm text-text-muted">
          {formatMessage({
            id: 'date_range_prefix',
            defaultMessage: 'Showing data from',
          })}{' '}
          <strong>{formatDateTime(dateRange?.start) || '—'}</strong>{' '}
          {formatMessage({ id: 'date_range_to', defaultMessage: 'to' })}{' '}
          <strong>{formatDateTime(dateRange?.end) || '—'}</strong>
        </div>
      )}

      {products.map((product) => (
        <TopSellingProductListItem key={product.productId} product={product} />
      ))}
    </div>
  );
};

export default TopSellingProductList;
