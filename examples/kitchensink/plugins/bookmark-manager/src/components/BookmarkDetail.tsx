import React from 'react';
import { useRouter } from 'next/router';
import useBookmarks from '../hooks/useBookmarks';
import useRemoveBookmark from '../hooks/useRemoveBookmark';

const styles = {
  page: 'space-y-6',
  header: 'flex items-center justify-between',
  title: 'text-2xl font-semibold text-text-primary',
  card: 'bg-surface rounded-lg border border-border-subtle shadow-sm overflow-hidden',
  cardBody: 'p-5',
  btnDanger:
    'inline-flex items-center gap-2 rounded-md bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring',
  emptyState: 'text-center py-16 text-text-muted',
  separator: 'border-t border-border-subtle my-4',
  backLink:
    'inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4 cursor-pointer',
  statusBadge: (status: string) => {
    const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
    if (status === 'ACTIVE') return `${base} bg-green-100 text-green-800`;
    if (status === 'DRAFT') return `${base} bg-yellow-100 text-yellow-800`;
    return `${base} bg-gray-100 text-gray-800`;
  },
};

const ArrowLeftIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
    />
  </svg>
);

const BookmarkDetail = ({ entityId }: { entityId: string }) => {
  const router = useRouter();
  const { bookmarks, loading } = useBookmarks();
  const { removeBookmark, loading: removing } = useRemoveBookmark();

  const navigate = (subPath: string) => {
    const cleanPath = subPath ? subPath.replace(/^\//, '') : '';
    router.push(cleanPath ? `/ext/bookmarks/${cleanPath}` : '/ext/bookmarks');
  };

  const handleRemove = async () => {
    await removeBookmark({ bookmarkId: entityId });
    navigate('');
  };

  const bookmark = bookmarks.find((b: any) => b._id === entityId);

  if (loading && bookmarks.length === 0) {
    return <div className="py-8 text-center text-text-muted">Loading...</div>;
  }

  if (!bookmark) {
    return (
      <div className={styles.page}>
        <button className={styles.backLink} onClick={() => navigate('')}>
          <ArrowLeftIcon />
          Back to Bookmarks
        </button>
        <div className={styles.emptyState}>
          <p className="text-lg font-medium mb-1">Bookmark not found</p>
          <p className="text-sm">The bookmark you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  const product = bookmark.product;

  return (
    <div className={styles.page}>
      <button className={styles.backLink} onClick={() => navigate('')}>
        <ArrowLeftIcon />
        Back to Bookmarks
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>{product?.texts?.title || 'Untitled Product'}</h1>
        <button className={styles.btnDanger} onClick={handleRemove} disabled={removing}>
          <TrashIcon />
          Remove Bookmark
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.cardBody}>
          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Product
              </span>
              <div className="mt-1 font-medium text-text-primary">
                {product?.texts?.title || 'Untitled'}
              </div>
            </div>

            {product?.texts?.slug && (
              <div>
                <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Slug</span>
                <div className="mt-1 text-sm text-text-primary font-mono">{product.texts.slug}</div>
              </div>
            )}

            {product?.texts?.description && (
              <div>
                <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                  Description
                </span>
                <p className="mt-1 text-sm text-text-primary whitespace-pre-wrap">
                  {product.texts.description}
                </p>
              </div>
            )}

            <div>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Status</span>
              <div className="mt-1">
                <span className={styles.statusBadge(product?.status)}>
                  {product?.status || 'UNKNOWN'}
                </span>
              </div>
            </div>

            {product?.media?.[0]?.file?.url && (
              <div>
                <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                  Image
                </span>
                <div className="mt-2">
                  <img
                    src={product.media[0].file.url}
                    alt={product.texts?.title || ''}
                    className="rounded-md border border-border-subtle max-w-xs"
                  />
                </div>
              </div>
            )}

            <div className={styles.separator} />

            <div className="flex gap-6 text-xs text-text-muted">
              <div>
                <span className="font-medium">Bookmarked:</span>{' '}
                {bookmark.created ? new Date(bookmark.created).toLocaleString() : '-'}
              </div>
              <div>
                <span className="font-medium">Bookmark ID:</span>{' '}
                <code className="font-mono">{bookmark._id}</code>
              </div>
              <div>
                <span className="font-medium">Product ID:</span>{' '}
                <code className="font-mono">{product?._id}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookmarkDetail;
