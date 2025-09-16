import React from 'react';
import Link from 'next/link';
import { useIntl } from 'react-intl';
import classNames from 'classnames';
import { FolderIcon, CalendarIcon } from '@heroicons/react/24/outline';
import Badge from '../../common/components/Badge';
import generateUniqueId from '../../common/utils/getUniqueId';

interface AssortmentListItemProps {
  assortment: any;
  className?: string;
}

const AssortmentListItem: React.FC<AssortmentListItemProps> = ({
  assortment,
  className,
}) => {
  const { formatMessage } = useIntl();

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge
        text={
          isActive
            ? formatMessage({
                id: 'active',
                defaultMessage: 'Active',
              })
            : formatMessage({
                id: 'inactive',
                defaultMessage: 'In-Active',
              })
        }
        color={isActive ? 'green' : 'yellow'}
        square
        dotted
      />
    );
  };

  const getAssortmentImage = () => {
    const media = assortment.media?.[0];
    if (media?.file?.url) {
      return (
        <img
          src={media.file.url}
          alt={assortment.texts?.title || 'Assortment'}
          className="w-full h-32 object-cover"
        />
      );
    }
    return (
      <div className="w-full h-32 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <FolderIcon className="w-12 h-12 text-slate-400 dark:text-slate-600" />
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div
      className={classNames(
        'bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow',
        className,
      )}
      style={{
        display: 'grid',
        gridTemplateRows: 'subgrid',
        gridRow: 'span 6',
      }}
    >
      {/* 1. Image */}
      <div className="relative">
        {getAssortmentImage()}
        <div className="absolute top-3 right-3">
          {getStatusBadge(assortment.isActive)}
        </div>
      </div>

      {/* 2. Title */}
      <h3 className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2 px-4 pt-0">
        {assortment.texts?.title ||
          formatMessage({
            id: 'untitled_assortment',
            defaultMessage: 'Untitled Assortment',
          })}
      </h3>

      {/* 3. Subtitle */}
      <div className="px-4">
        {assortment.texts?.subtitle ? (
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
            {assortment.texts.subtitle}
          </p>
        ) : (
          <div className="h-5"></div>
        )}
      </div>

      {/* 4. Metadata */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500 px-4">
        <div className="flex items-center gap-1">
          <CalendarIcon className="w-3 h-3" />
          {formatDate(assortment.updated)}
        </div>
        {assortment.sequence && (
          <span className="font-mono">#{assortment.sequence}</span>
        )}
      </div>

      {/* 5. Tags */}
      <div className="px-4">
        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
          ID: {assortment._id}
        </span>
        {assortment.tags && assortment.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {assortment.tags.slice(0, 3).map((tag: string, index: number) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded"
              >
                {tag}
              </span>
            ))}
            {assortment.tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                +{assortment.tags.length - 3}
              </span>
            )}
          </div>
        ) : assortment.childrenCount > 0 ? (
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {formatMessage(
              {
                id: 'children_count',
                defaultMessage: '{count} children',
              },
              { count: assortment.childrenCount },
            )}
          </div>
        ) : (
          <div className="h-6"></div>
        )}
      </div>

      {/* 6. Actions */}
      <div className="border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
        <Link
          href={`/assortments?assortmentSlug=${generateUniqueId(assortment)}`}
          className="text-center text-sm text-slate-900 dark:text-slate-200 hover:text-slate-800 dark:hover:text-slate-300 py-3"
        >
          {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
        </Link>
      </div>
    </div>
  );
};

export default AssortmentListItem;
