import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Table from '../../common/components/Table';
import MediaAvatar from '../../common/components/MediaAvatar';

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MediaListItem = ({ media }) => {
  const isImage = media.type?.startsWith('image');

  return (
    <Table.Row>
      <Table.Cell className="whitespace-nowrap px-6">
        <div className="flex items-center gap-3 text-sm">
          {isImage ? (
            <MediaAvatar file={media} />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-surface-secondary">
              <span className="text-xs text-text-secondary">
                {media.type?.split('/')[1]?.toUpperCase() || '?'}
              </span>
            </div>
          )}
          <Link
            href={`/media?mediaId=${media._id}`}
            className="text-text-primary"
          >
            {media.name}
          </Link>
        </div>
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap px-6">
        <Badge text={media.type} square color="slate" />
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap px-6">
        <span className="text-sm">{formatFileSize(media.size)}</span>
      </Table.Cell>
    </Table.Row>
  );
};

export default MediaListItem;
