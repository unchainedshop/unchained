import React from 'react';
import { useRouter } from 'next/router';
import useBookmarks from '../hooks/useBookmarks';

const BookmarkWidget = () => {
  const router = useRouter();
  const { bookmarks, loading } = useBookmarks();

  const navigate = (subPath: string) => {
    const cleanPath = subPath ? subPath.replace(/^\//, '') : '';
    router.push(cleanPath ? `/ext/bookmarks/${cleanPath}` : '/ext/bookmarks');
  };

  const recent = bookmarks.slice(0, 5);

  return (
    <div className="bg-surface rounded-lg border border-border-subtle shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle">
        <h3 className="text-sm font-semibold text-text-primary">Recent Bookmarks</h3>
        <button className="text-xs text-accent hover:text-accent-hover" onClick={() => navigate('')}>
          View all
        </button>
      </div>
      {loading && bookmarks.length === 0 ? (
        <div className="p-5 text-center text-sm text-text-muted">Loading...</div>
      ) : recent.length === 0 ? (
        <div className="p-5 text-center text-sm text-text-muted">No bookmarks yet</div>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {recent.map((b: any) => (
            <li
              key={b._id}
              className="px-5 py-3 hover:bg-surface-raised transition-colors cursor-pointer"
              onClick={() => navigate(`/${b._id}`)}
            >
              <div className="text-sm font-medium text-text-primary truncate">
                {b.product?.texts?.title || 'Untitled Product'}
              </div>
              <div className="text-xs text-text-muted truncate">
                {b.product?.texts?.slug || b.product?._id || '-'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BookmarkWidget;
