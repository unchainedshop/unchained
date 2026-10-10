import { useIntl } from 'react-intl';
import Badge from '@/components/ui/Badge';
import ImageWithFallback from '@/components/ui/ImageWithFallback';

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MediaDetail = ({ media }) => {
  const { formatMessage } = useIntl();
  const isImage = media.type?.startsWith('image');

  return (
    <div className="mt-5 rounded-lg border border-border-subtle bg-surface p-4 shadow-sm sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          <div className="my-1 text-sm font-semibold">
            {formatMessage({ id: 'type_colon', defaultMessage: 'Type:' })}
            <span className="ml-2">
              <Badge text={media.type} square className="p-2" color="slate" />
            </span>
          </div>
          <div className="my-1 text-sm font-semibold">
            {formatMessage({ id: 'size', defaultMessage: 'Size' })}:
            <span className="ml-2 font-normal">
              {formatFileSize(media.size)}
            </span>
          </div>
        </div>

        {isImage && media.url && (
          <div className="flex justify-center rounded-lg border border-border-subtle bg-surface-subtle p-4">
            <ImageWithFallback
              src={media.url}
              alt={media.name}
              width={400}
              height={400}
              className="max-h-96 rounded-md object-contain"
            />
          </div>
        )}

        {media.url && (
          <div className="text-sm">
            <span className="font-semibold">
              {formatMessage({ id: 'url', defaultMessage: 'URL' })}:
            </span>
            <a
              href={media.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 break-all text-blue-600 hover:underline dark:text-blue-400"
            >
              {media.url}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaDetail;
