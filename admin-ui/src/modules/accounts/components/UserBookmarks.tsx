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
    <div className="mt-4">
      <ul className="divide-y divide-border-default">
        {bookmarks.map(({ _id, created, product }) => (
          <li key={_id} className="flex items-center gap-4 py-4">
            <Link
              href={`/products?slug=${product?._id}`}
              className="shrink-0"
            >
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
                width={64}
                height={64}
                className="rounded-md object-cover"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/products?slug=${product?._id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {product?.texts?.title ||
                  formatMessage({
                    id: 'unnamed-product',
                    defaultMessage: 'Unnamed product',
                  })}
              </Link>
              {created && (
                <p className="mt-1 text-xs text-secondary">
                  {formatMessage({
                    id: 'bookmarked_on',
                    defaultMessage: 'Bookmarked on',
                  })}{' '}
                  {formatDateTime(created, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
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
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserBookmarks;
