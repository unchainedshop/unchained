import Link from 'next/link';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import { TrashIcon } from '@heroicons/react/20/solid';

import Button from '@/components/ui/Button';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import Loading from '@/components/ui/Loading';
import NoData from '@/components/ui/NoData';
import defaultNextImageLoader from '../../common/utils/defaultNextImageLoader';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import useUserBookmarks from '../hooks/useUserBookmarks';
import useRemoveBookmark from '../hooks/useRemoveBookmark';

const UserBookmarks = ({ _id: userId }) => {
  const { bookmarks, loading } = useUserBookmarks({ userId });
  const { removeBookmark } = useRemoveBookmark();
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  const onRemoveBookmark = async (bookmarkId: string) => {
    try {
      await removeBookmark(bookmarkId);
      toast.success(
        formatMessage({
          id: 'bookmark_removed',
          defaultMessage: 'Bookmark removed',
        }),
      );
    } catch (e) {
      toast.error(e?.message);
    }
  };

  if (loading) return <Loading />;

  if (!bookmarks.length) {
    return (
      <div className="mt-4">
        <NoData
          message={formatMessage({
            id: 'no_bookmarks',
            defaultMessage: 'No bookmarks',
          })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {bookmarks.map(({ _id, created, product }) => (
        <div
          key={_id}
          className="rounded-lg shadow-sm bg-surface p-4 border-border-subtle"
        >
          <div className="flex items-center">
            <Link href={`/products?slug=${product?._id}`} className="shrink-0">
              <ImageWithFallback
                src={
                  (product?.media?.length && product.media[0]?.file?.url) ||
                  '/no-image.jpg'
                }
                loader={defaultNextImageLoader}
                alt={
                  product?.texts?.title ||
                  formatMessage({
                    id: 'product-image',
                    defaultMessage: 'Product image',
                  })
                }
                width={48}
                height={48}
                className="h-12 w-12 rounded-lg object-cover object-center"
              />
            </Link>
            <div className="ml-4 flex-1 min-w-0">
              <Link
                href={`/products?slug=${product?._id}`}
                className="text-sm font-semibold text-text-primary hover:underline"
              >
                {product?.texts?.title ||
                  formatMessage({
                    id: 'unnamed-product',
                    defaultMessage: 'Unnamed product',
                  })}
              </Link>
              {created && (
                <p className="text-xs text-text-muted">
                  <time dateTime={created as string}>
                    {formatMessage({
                      id: 'bookmarked_on',
                      defaultMessage: 'Bookmarked on',
                    })}{' '}
                    {formatDateTime(created, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                </p>
              )}
            </div>
            <Button
              variant="danger"
              size="xs"
              rounded="full"
              icon={<TrashIcon className="h-5 w-5" />}
              onClick={() => onRemoveBookmark(_id)}
              aria-label={formatMessage({
                id: 'remove_bookmark',
                defaultMessage: 'Remove bookmark',
              })}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserBookmarks;
