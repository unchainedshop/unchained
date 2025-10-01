import React from 'react';
import Link from 'next/link';
import { useIntl } from 'react-intl';
import ImageWithFallback from '../../../common/components/ImageWithFallback';
import generateUniqueId from '../../../common/utils/getUniqueId';
import { useFormatPrice } from '../../../common/utils/utils';
import { ProductStatusBadge } from '../../../product/components/ProductStatusBadge';
import CopyableId from '../shared/CopyableId';
const ProductItemWrapperCompact = ({
  product,
  tab = null,
  children = null,
}) => {
  const { formatMessage } = useIntl();
  const { formatPrice } = useFormatPrice();

  if (!product) return children;
  const {
    texts = [],
    media = [],
    catalogPrice,
    commerce,
    warehousing = {},
    supply = {},
    tags = [],
    variations = [],
    proxy,
    bundleItems = [],
    _id,
    type,
    status,
    reviews = [],
  } = product;
  const text = Array.isArray(texts) ? texts[0] : texts;
  const price = catalogPrice || commerce?.pricing?.[0];
  const imageUrl = media[0]?.file?.url;
  const totalVariations = variations.length;
  const totalAssignments = proxy?.assignments?.length ?? 0;
  const totalBundleItemsLength = bundleItems.length;
  const totalReviews = reviews?.length;
  const productSlug = generateUniqueId(product);

  return (
    <div className="relative border rounded-xl p-4 shadow-sm bg-white dark:bg-slate-900 space-y-4">
      <Link
        href={`/products?slug=${productSlug}`}
        className="absolute top-2 right-2 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
      </Link>

      {tags?.length > 0 && (
        <div className="absolute top-10 right-2 flex flex-wrap gap-1 justify-end max-w-[60%]">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        <ImageWithFallback
          src={imageUrl}
          alt={text?.title || 'Product image'}
          width={60}
          height={60}
          className="rounded-md object-cover shrink-0"
        />

        <div className="flex-1 space-y-1 overflow-hidden">
          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {text?.title || 'Untitled Product'}
          </div>

          <div className="flex items-center gap-3 mt-1">
            <ProductStatusBadge status={status} />

            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded">
              {(product.__typename || type || 'SimpleProduct').replace(
                '_PRODUCT',
                '',
              )}
            </span>

            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {price ? (
                formatPrice(price)
              ) : (
                <span className="text-slate-400">
                  {formatMessage({ id: 'no_price', defaultMessage: 'N/A' })}
                </span>
              )}
            </span>

            <CopyableId id={_id} />
          </div>

          <div className="flex flex-wrap text-xs gap-2 mt-2">
            {type === 'CONFIGURABLE_PRODUCT' && (
              <>
                <Link
                  href={`/products?slug=${productSlug}&tab=variations`}
                  className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-200 hover:underline"
                >
                  {formatMessage({
                    id: 'variations',
                    defaultMessage: 'Variations',
                  })}
                  : <strong>{totalVariations}</strong>
                </Link>

                <Link
                  href={`/products?slug=${productSlug}&tab=assignments`}
                  className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-200 hover:underline"
                >
                  {formatMessage({
                    id: 'products',
                    defaultMessage: 'Products',
                  })}
                  : <strong>{totalAssignments}</strong>
                </Link>
              </>
            )}

            {type === 'BUNDLE_PRODUCT' && (
              <Link
                href={`/products?slug=${productSlug}&tab=bundled_products`}
                className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-200 hover:underline"
              >
                {formatMessage({
                  id: 'bundle_products',
                  defaultMessage: 'Bundles',
                })}
                : <strong>{totalBundleItemsLength}</strong>
              </Link>
            )}
            <Link
              href={`/products?slug=${productSlug}&tab=reviews`}
              className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-200 hover:underline"
            >
              {formatMessage({
                id: 'reviews',
                defaultMessage: 'Reviews',
              })}
              : <strong>{totalReviews}</strong>
            </Link>
            {warehousing.sku && (
              <div>
                {formatMessage({ id: 'sku', defaultMessage: 'SKU' })}:{' '}
                <strong>{warehousing.sku}</strong>
              </div>
            )}
            {warehousing.baseUnit && (
              <div>
                {formatMessage({ id: 'unit', defaultMessage: 'Unit' })}:{' '}
                <strong>{warehousing.baseUnit}</strong>
              </div>
            )}
            {supply && (
              <div>
                {formatMessage({
                  id: 'dimensions',
                  defaultMessage: 'Dimensions',
                })}
                :{' '}
                <strong>
                  {supply.lengthInMillimeters}×{supply.widthInMillimeters}×
                  {supply.heightInMillimeters} mm
                </strong>
              </div>
            )}
            {supply?.weightInGram && (
              <div>
                {formatMessage({ id: 'weight', defaultMessage: 'Weight' })}:{' '}
                <strong>{supply.weightInGram} g</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {children && (
        <div className="pt-2">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg shadow-inner border border-slate-200 dark:border-slate-700">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductItemWrapperCompact;
