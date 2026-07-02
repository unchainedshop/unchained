import React, { useState } from 'react';
import { useRouter } from 'next/router';
import useBookmarks from '../hooks/useBookmarks';
import useRemoveBookmark from '../hooks/useRemoveBookmark';

const styles = {
  page: 'space-y-6',
  header: 'flex items-center justify-between',
  title: 'text-2xl font-semibold text-text-primary',
  subtitle: 'text-sm text-text-muted',
  card: 'bg-surface rounded-lg border border-border-subtle shadow-sm overflow-hidden',
  table: 'w-full text-sm',
  th: 'text-left text-xs font-medium text-text-muted uppercase tracking-wide py-3 px-4 border-b border-border-subtle',
  td: 'py-3 px-4 border-b border-border-subtle text-text-primary',
  btnPrimary:
    'inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-on-accent hover:bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring',
  btnGhost:
    'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-raised transition-colors',
  input:
    'w-full rounded-md border border-border bg-surface-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus-ring',
  emptyState: 'text-center py-16 text-text-muted',
  link: 'text-accent hover:text-accent-hover hover:underline cursor-pointer',
  userBanner:
    'flex items-center gap-3 px-4 py-3 bg-surface-raised rounded-lg border border-border-subtle text-sm',
  statusBadge: (status: string) => {
    const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
    if (status === 'ACTIVE') return `${base} bg-green-100 text-green-800`;
    if (status === 'DRAFT') return `${base} bg-yellow-100 text-yellow-800`;
    return `${base} bg-gray-100 text-gray-800`;
  },
};

const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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

const SearchIcon = () => (
  <svg
    className="h-4 w-4 text-text-muted"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
    />
  </svg>
);

const UserIcon = () => (
  <svg
    className="h-5 w-5 text-accent"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
    />
  </svg>
);

const BookmarkList = () => {
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { user, bookmarks, loading } = useBookmarks();
  const { removeBookmark, loading: removing } = useRemoveBookmark();

  const navigate = (subPath: string) => {
    const cleanPath = subPath ? subPath.replace(/^\//, '') : '';
    router.push(cleanPath ? `/ext/bookmarks/${cleanPath}` : '/ext/bookmarks');
  };

  const filtered = bookmarks.filter((b: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const title = b.product?.texts?.title?.toLowerCase() || '';
    const slug = b.product?.texts?.slug?.toLowerCase() || '';
    return title.includes(q) || slug.includes(q);
  });

  if (loading && bookmarks.length === 0) {
    return (
      <div className={styles.page}>
        <div className="py-8 text-center text-text-muted">Loading bookmarks...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Bookmarks</h1>
          <p className={styles.subtitle}>
            {bookmarks.length} bookmarked product{bookmarks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className={styles.btnPrimary} onClick={() => navigate('/new')}>
          <PlusIcon />
          Add Bookmark
        </button>
      </div>

      {user && (
        <div className={styles.userBanner}>
          <UserIcon />
          <div>
            <span className="font-medium text-text-primary">
              {user.name || user.username || 'Unknown'}
            </span>
            {user.primaryEmail?.address && (
              <span className="text-text-muted ml-2">({user.primaryEmail.address})</span>
            )}
          </div>
          <span className="ml-auto text-xs text-text-muted">
            {bookmarks.length} bookmarked product{bookmarks.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div className={styles.card}>
        <div className="p-4 border-b border-border-subtle">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              className={`${styles.input} pl-9`}
              placeholder="Search bookmarks by product title or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            {bookmarks.length === 0 ? (
              <div>
                <p className="text-lg font-medium mb-1">No bookmarks yet</p>
                <p className="text-sm mb-4">Bookmark a product to get started.</p>
                <button className={styles.btnPrimary} onClick={() => navigate('/new')}>
                  <PlusIcon />
                  Add Bookmark
                </button>
              </div>
            ) : (
              <p>No bookmarks match your search.</p>
            )}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Product</th>
                <th className={styles.th}>Slug</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Bookmarked</th>
                <th className={`${styles.th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bookmark: any) => (
                <tr key={bookmark._id} className="hover:bg-surface-raised transition-colors">
                  <td className={styles.td}>
                    <span
                      className={`${styles.link} font-medium`}
                      onClick={() => navigate(`/${bookmark._id}`)}
                    >
                      {bookmark.product?.texts?.title || 'Untitled Product'}
                    </span>
                  </td>
                  <td className={`${styles.td} text-text-muted text-xs font-mono`}>
                    {bookmark.product?.texts?.slug || '-'}
                  </td>
                  <td className={styles.td}>
                    <span className={styles.statusBadge(bookmark.product?.status)}>
                      {bookmark.product?.status || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className={`${styles.td} text-text-muted text-xs`}>
                    {bookmark.created ? new Date(bookmark.created).toLocaleDateString() : '-'}
                  </td>
                  <td className={`${styles.td} text-right`}>
                    <button
                      className={`${styles.btnGhost} text-danger hover:text-danger`}
                      onClick={() => removeBookmark({ bookmarkId: bookmark._id })}
                      disabled={removing}
                      title="Remove bookmark"
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BookmarkList;
