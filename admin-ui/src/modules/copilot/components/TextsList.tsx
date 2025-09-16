import React from 'react';
import Badge from '../../common/components/Badge';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useIntl } from 'react-intl';

interface ProductText {
  _id: string;
  productId?: string;
  assortmentId?: string;
  filterId?: string;
  locale: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  brand?: string | null;
  vendor?: string | null;
  labels?: string[];
  created: string;
  updated: string;
  productVariationId?: string | null;
  productVariationOptionValue?: string | null;
}

interface Props {
  text: ProductText;
}

export const TextItemCompact = ({ text }: Props) => {
  const { formatMessage } = useIntl();

  const infoRow = (label: string, value: string | null | undefined) => {
    if (!value) return null;
    return (
      <div className="text-sm text-slate-700 dark:text-slate-300">
        <span className="font-medium text-slate-600 dark:text-slate-400">
          {label}:
        </span>{' '}
        {value}
      </div>
    );
  };

  return (
    <div className="flex items-start gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-200">
      <div className="w-16 h-16 flex-shrink-0 bg-slate-50 dark:bg-slate-700 rounded-md flex items-center justify-center text-2xl text-slate-400">
        <GlobeAltIcon className="w-6 h-6" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {text.title || 'Untitled'}
          </h3>
          <Badge text={text.locale.toUpperCase()} color="blue" square dotted />
        </div>

        {infoRow(
          formatMessage({ id: 'subtitle', defaultMessage: 'Subtitle' }),
          text.subtitle,
        )}
        {infoRow(
          formatMessage({ id: 'description', defaultMessage: 'Description' }),
          text.description,
        )}
        {infoRow(
          formatMessage({ id: 'slug', defaultMessage: 'Slug' }),
          text.slug,
        )}
        {infoRow(
          formatMessage({ id: 'brand', defaultMessage: 'Brand' }),
          text.brand,
        )}
        {infoRow(
          formatMessage({ id: 'vendor', defaultMessage: 'Vendor' }),
          text.vendor,
        )}
        {infoRow(
          formatMessage({
            id: 'variation_option',
            defaultMessage: 'Variation option',
          }),
          text?.productVariationOptionValue,
        )}
        {infoRow(
          formatMessage({
            id: 'variation_id',
            defaultMessage: 'Variation ID',
          }),
          text?.productVariationId,
        )}

        {text.labels && text.labels.length > 0 && (
          <div className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-medium text-slate-600 dark:text-slate-400">
              {formatMessage({ id: 'labels', defaultMessage: 'Labels' })}:
            </span>{' '}
            {text.labels.join(', ')}
          </div>
        )}
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {formatMessage({ id: 'id', defaultMessage: 'ID' })}: {text._id}
        </div>
      </div>
    </div>
  );
};

const TextsList = ({ texts, ...rest }) => {
  return (
    <div className="space-y-3">
      {texts.map((text) => (
        <TextItemCompact key={text._id} text={text} {...rest} />
      ))}
    </div>
  );
};

export default TextsList;
