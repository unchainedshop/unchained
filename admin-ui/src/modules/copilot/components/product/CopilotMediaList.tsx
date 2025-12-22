import React from 'react';
import { useIntl } from 'react-intl';
import ImageWithFallback from '../../../common/components/ImageWithFallback';
import useFormatDateTime from '../../../common/utils/useFormatDateTime';

interface CopilotMediaListProps {
  media: {
    _id: string;
    name: string;
    size: number;
    type: string;
    url?: string;
    file?: { url?: string; size?: number; type?: string };
    created: string;
    updated: string;
  }[];
}

const CopilotMediaList: React.FC<CopilotMediaListProps> = ({ media }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  if (!media?.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {media.map((m) => {
        const imageUrl = m.file?.url || m.url;
        return (
          <div
            key={m._id}
            className="flex flex-col items-start gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-200 w-full"
          >
            <div className="w-full h-32 flex-shrink-0 bg-slate-50 dark:bg-slate-700 rounded-md overflow-hidden">
              {imageUrl ? (
                <ImageWithFallback
                  src={imageUrl}
                  alt={m.name}
                  className="w-full h-full object-cover"
                  width={256}
                  height={128}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <span className="text-3xl">🖼️</span>
                </div>
              )}
            </div>

            <div className="flex-1 w-full">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {m.name}
              </h3>

              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span>
                  {formatMessage({ id: 'media.size', defaultMessage: 'Size' })}:{' '}
                  {(m?.file?.size / 1024).toFixed(1)} KB
                </span>
                <span>
                  {formatMessage({ id: 'media.type', defaultMessage: 'Type' })}:{' '}
                  {m?.file?.type}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-start text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {formatMessage({ id: 'media.id', defaultMessage: 'ID' })}:{' '}
                {m._id}
              </span>
              <span>
                {formatMessage({
                  id: 'created',
                  defaultMessage: 'Created',
                })}
                : {formatDateTime(m.created)}
              </span>
              <span>
                {formatMessage({
                  id: 'updated',
                  defaultMessage: 'Updated',
                })}
                : {formatDateTime(m.updated)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CopilotMediaList;
