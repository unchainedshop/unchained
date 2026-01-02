import { useIntl } from 'react-intl';
import ImageWithFallback from '../../../common/components/ImageWithFallback';
import { useFormatPrice } from '../../../common/utils/utils';
import Link from 'next/link';
import generateUniqueId from '../../../common/utils/getUniqueId';

const BundleItemCompact = ({ product, quantity }) => {
  const { formatPrice } = useFormatPrice();
  const { formatMessage } = useIntl();

  const title =
    product?.texts?.title ??
    formatMessage({
      id: 'product_untitled',
      defaultMessage: 'Untitled product',
    });
  const sku = product?.warehousing?.sku;
  const baseUnit = product?.warehousing?.baseUnit;
  const type = product?.type?.replace('_PRODUCT', '');
  const image = product?.media?.[0]?.file?.url;
  const price = product?.commerce?.pricing?.[0]
    ? formatPrice(product.commerce.pricing[0])
    : null;
  const supply = product?.supply;
  const tags = product?.tags;

  return (
    <div className="flex items-start gap-4 border rounded-xl p-3 shadow-sm bg-white dark:bg-slate-900 hover:shadow-md transition-shadow relative">
      <div className="flex-1 flex gap-3 items-start">
        <ImageWithFallback
          src={image}
          alt={title}
          width={60}
          height={60}
          className="rounded-md object-cover shrink-0"
        />
        <div className="flex-1 flex flex-col gap-1 overflow-hidden">
          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {title}
          </div>

          <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            {type && (
              <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                {type}
              </span>
            )}
            {tags?.map((tag, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 text-xs rounded-full text-slate-700 dark:text-slate-200 truncate bg-blue-100 dark:bg-blue-700`}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-1">
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white">
              {formatMessage({ id: 'quantity', defaultMessage: 'Quantity' })}:{' '}
              {quantity}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300 mt-1">
            {sku && (
              <span>
                {formatMessage({ id: 'sku', defaultMessage: 'SKU' })}:{' '}
                <strong>{sku}</strong>
              </span>
            )}
            {baseUnit && (
              <span>
                {formatMessage({ id: 'unit', defaultMessage: 'Unit' })}:{' '}
                <strong>{baseUnit}</strong>
              </span>
            )}
            <span>
              {formatMessage({ id: 'id', defaultMessage: 'ID' })}:{' '}
              <strong>{product?._id}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col text-xs text-slate-600 dark:text-slate-300 items-end min-w-[120px] gap-1">
        {price && (
          <div className="text-sm font-semibold text-slate-900 dark:text-white">
            {price}
          </div>
        )}
        {supply && (
          <div>
            {formatMessage({ id: 'dimensions', defaultMessage: 'Dimensions' })}:{' '}
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

        <Link
          href={`/products?slug=${generateUniqueId(product)}`}
          className="mt-1 text-sm px-3 py-1 rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-white transition-colors"
        >
          {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
        </Link>
      </div>
    </div>
  );
};

export const BundleItemList = ({ bundleItems }) => {
  if (!bundleItems?.length) return null;

  return (
    <div className="space-y-2">
      {bundleItems.map(({ product, quantity }) => (
        <BundleItemCompact
          key={`BundleItemList-${product._id}-${quantity}`}
          product={product}
          quantity={quantity}
        />
      ))}
    </div>
  );
};

export default BundleItemCompact;
