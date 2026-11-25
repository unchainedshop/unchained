import Link from 'next/link';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import Badge from '@/components/ui/Badge';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MediaGridItem = ({ media }) => {
  const isImage = media.type?.startsWith('image');

  return (
    <Link
      href={`/media?mediaId=${media._id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex h-40 items-center justify-center bg-surface-subtle">
        {isImage && media.url ? (
          <ImageWithFallback
            src={media.url}
            alt={media.name}
            width={200}
            height={160}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-text-secondary">
            <DocumentTextIcon className="h-10 w-10" />
            <span className="text-xs uppercase">
              {media.type?.split('/')[1] || '?'}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <span className="truncate text-sm font-medium text-text-primary group-hover:underline">
          {media.name}
        </span>
        <div className="flex items-center justify-between">
          <Badge text={media.type?.split('/')[0]} square color="slate" />
          <span className="text-xs text-text-secondary">
            {formatFileSize(media.size)}
          </span>
        </div>
      </div>
    </Link>
  );
};

const MediaGrid = ({ medias }) => {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {medias?.map((media) => (
        <MediaGridItem key={media._id} media={media} />
      ))}
    </div>
  );
};

export default MediaGrid;
