import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import useBookmarks from '../hooks/useBookmarks';
import useBookmarkProduct from '../hooks/useBookmarkProduct';
import { useProducts } from '@unchainedshop/client/product';

const styles = {
  page: 'space-y-6',
  header: 'flex items-center justify-between',
  title: 'text-2xl font-semibold text-text-primary',
  subtitle: 'text-sm text-text-muted',
  card: 'bg-surface rounded-lg border border-border-subtle shadow-sm overflow-hidden',
  table: 'w-full text-sm',
  th: 'text-left text-xs font-medium text-text-muted uppercase tracking-wide py-3 px-4 border-b border-border-subtle',
  td: 'py-3 px-4 border-b border-border-subtle text-text-primary',
  btnSecondary:
    'inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-raised transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring',
  input:
    'w-full rounded-md border border-border bg-surface-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus-ring',
  emptyState: 'text-center py-16 text-text-muted',
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

const BookmarkIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
    />
  </svg>
);

const BookmarkSolidIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z"
      clipRule="evenodd"
    />
  </svg>
);

const BookmarkCreate = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();

  const navigate = (subPath: string) => {
    const cleanPath = subPath ? subPath.replace(/^\//, '') : '';
    router.push(cleanPath ? `/ext/bookmarks/${cleanPath}` : '/ext/bookmarks');
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  const { products, loading: productsLoading } = useProducts({
    queryString: debouncedSearch,
    limit: 20,
  });

  const { bookmarks } = useBookmarks();
  const { bookmarkProduct, loading: bookmarking } = useBookmarkProduct();

  const bookmarkedProductIds = new Set(bookmarks.map((b: any) => b.product?._id));

  return (
    <div className={styles.page}>
      <button className={styles.backLink} onClick={() => navigate('')}>
        <ArrowLeftIcon />
        Back to Bookmarks
      </button>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Add Bookmark</h1>
          <p className={styles.subtitle}>Search for a product and bookmark it</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className="p-4 border-b border-border-subtle">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              className={`${styles.input} pl-9`}
              placeholder="Search products by title..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {productsLoading && products.length === 0 ? (
          <div className="p-8 text-center text-text-muted">Loading products...</div>
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No products found.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Product</th>
                <th className={styles.th}>Slug</th>
                <th className={styles.th}>Status</th>
                <th className={`${styles.th} text-right`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product: any) => {
                const isBookmarked = bookmarkedProductIds.has(product._id);
                return (
                  <tr key={product._id} className="hover:bg-surface-raised transition-colors">
                    <td className={styles.td}>
                      <span className="font-medium">{product.texts?.title || 'Untitled'}</span>
                    </td>
                    <td className={`${styles.td} text-text-muted text-xs font-mono`}>
                      {product.texts?.slug || '-'}
                    </td>
                    <td className={styles.td}>
                      <span className={styles.statusBadge(product.status)}>
                        {product.status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className={`${styles.td} text-right`}>
                      {isBookmarked ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-accent">
                          <BookmarkSolidIcon />
                          Bookmarked
                        </span>
                      ) : (
                        <button
                          className={styles.btnSecondary}
                          onClick={() => bookmarkProduct({ productId: product._id })}
                          disabled={bookmarking}
                        >
                          <BookmarkIcon />
                          Bookmark
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BookmarkCreate;
