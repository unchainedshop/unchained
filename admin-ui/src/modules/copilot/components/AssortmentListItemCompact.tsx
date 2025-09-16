import React from 'react';
import Link from 'next/link';
import { useIntl } from 'react-intl';
import ImageWithFallback from '../../common/components/ImageWithFallback';
import Badge from '../../common/components/Badge';
import generateUniqueId from '../../common/utils/getUniqueId';
import CopyableId from './shared/CopyableId';

const AssortmentListItemCompact = ({ assortment, children = null }) => {
  const { formatMessage } = useIntl();
  if (!assortment) return null;

  const {
    texts = {},
    media = [],
    tags = [],
    _id,
    updated,
    sequence,
    products = [],
    links = [],
    filters = [],
    isActive,
  } = assortment;
  const productsCount = products?.length ?? 0;
  const filtersCount = filters?.length ?? 0;
  const linksCount = links?.length ?? 0;
  const assortmentSlug = generateUniqueId(assortment);
  const thumbnailUrl = media[0]?.file?.url;

  const formatDate = (dateString?: string) =>
    dateString ? new Date(dateString).toLocaleDateString() : '';

  return (
    <div className="relative border rounded-xl p-4 shadow-sm bg-white dark:bg-slate-900 space-y-4">
      <Link
        href={`/assortments?assortmentSlug=${assortmentSlug}`}
        className="absolute top-2 right-2 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
      </Link>

      <div className="flex items-start gap-4">
        <div className="w-16 h-16 flex-shrink-0 bg-slate-50 dark:bg-slate-700 rounded-md overflow-hidden">
          {thumbnailUrl ? (
            <ImageWithFallback
              src={thumbnailUrl}
              alt={texts.title || 'Assortment'}
              className="w-full h-full object-cover"
              width={64}
              height={64}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-2xl">
              📁
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {texts.title ||
              formatMessage({
                id: 'untitled_assortment',
                defaultMessage: 'Untitled Assortment',
              })}
          </div>

          {texts.subtitle && (
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
              {texts.subtitle}
            </div>
          )}
          <CopyableId id={_id} />
          {tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag, idx) => (
                <span
                  key={tag + idx}
                  className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap mt-8 gap-1">
          <Badge
            text={
              isActive
                ? formatMessage({ id: 'active', defaultMessage: 'Active' })
                : formatMessage({ id: 'inactive', defaultMessage: 'In-Active' })
            }
            color={isActive ? 'green' : 'yellow'}
            square
            dotted
          />
          {sequence && <span className="font-mono">#{sequence}</span>}
          {updated && <span>{formatDate(updated)}</span>}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t pt-2 mt-2">
        <Link
          href={`/assortments/?assortmentSlug=${assortmentSlug}&tab=links`}
          className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {formatMessage({ id: 'children', defaultMessage: 'Children' })}
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
            {linksCount}
          </span>
        </Link>

        <Link
          href={`/assortments?assortmentSlug=${assortmentSlug}&tab=filters`}
          className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {formatMessage({ id: 'filters', defaultMessage: 'Filters' })}
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
            {filtersCount}
          </span>
        </Link>

        <Link
          href={`/assortments?assortmentSlug=${assortmentSlug}&tab=products`}
          className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {formatMessage({ id: 'products', defaultMessage: 'Products' })}
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
            {productsCount}
          </span>
        </Link>
      </div>

      {children && (
        <div className="pt-2">
          <div
            className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg shadow-inner 
                          border border-slate-200 dark:border-slate-700"
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssortmentListItemCompact;
