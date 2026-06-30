import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useRouter } from 'next/router';

// ---- GraphQL query to demonstrate shared Apollo context ----

const ME_QUERY = gql`
  query PluginCurrentUser {
    me {
      _id
      username
      name
      primaryEmail {
        address
      }
    }
  }
`;

// ---- LocalStorage-backed data layer ----

interface Bookmark {
  _id: string;
  title: string;
  url: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'unchained-plugin-bookmarks';

const loadBookmarks = (): Bookmark[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveBookmarks = (bookmarks: Bookmark[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
};

const generateId = () =>
  `bm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ---- Shared styles ----

const styles = {
  page: 'space-y-6',
  header: 'flex items-center justify-between',
  title: 'text-2xl font-semibold text-text-primary',
  subtitle: 'text-sm text-text-muted',
  card: 'bg-surface rounded-lg border border-border-subtle shadow-sm overflow-hidden',
  cardBody: 'p-5',
  table: 'w-full text-sm',
  th: 'text-left text-xs font-medium text-text-muted uppercase tracking-wide py-3 px-4 border-b border-border-subtle',
  td: 'py-3 px-4 border-b border-border-subtle text-text-primary',
  btnPrimary:
    'inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-text-on-accent hover:bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring',
  btnSecondary:
    'inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-raised transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring',
  btnDanger:
    'inline-flex items-center gap-2 rounded-md bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring',
  btnGhost:
    'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-raised transition-colors',
  input:
    'w-full rounded-md border border-border bg-surface-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus-ring',
  textarea:
    'w-full rounded-md border border-border bg-surface-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus-ring min-h-[80px]',
  label: 'block text-sm font-medium text-text-primary mb-1',
  fieldGroup: 'space-y-1',
  formGrid: 'grid gap-5',
  tag: 'inline-flex items-center rounded-full bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-text-secondary',
  emptyState: 'text-center py-16 text-text-muted',
  link: 'text-accent hover:text-accent-hover hover:underline cursor-pointer',
  separator: 'border-t border-border-subtle my-4',
  backLink:
    'inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4 cursor-pointer',
  userBanner:
    'flex items-center gap-3 px-4 py-3 bg-surface-raised rounded-lg border border-border-subtle text-sm',
};

// ---- SVG Icons ----

const PlusIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const PencilIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);

const SearchIcon = () => (
  <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const UserIcon = () => (
  <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

// ---- Navigation helper ----

const usePluginRouter = () => {
  const router = useRouter();

  const navigate = useCallback(
    (subPath: string) => {
      const cleanPath = subPath ? subPath.replace(/^\//, '') : '';
      router.push(cleanPath ? `/ext/bookmarks/${cleanPath}` : '/ext/bookmarks');
    },
    [router],
  );

  return { navigate };
};

// ---- Current User Banner (demonstrates Apollo context sharing) ----

const CurrentUserBanner = () => {
  const { data, loading } = useQuery(ME_QUERY);

  if (loading) {
    return (
      <div className={styles.userBanner}>
        <div className="h-5 w-5 animate-pulse bg-surface-subtle rounded-full" />
        <span className="text-text-muted">Loading user...</span>
      </div>
    );
  }

  const user = data?.me;
  if (!user) return null;

  return (
    <div className={styles.userBanner}>
      <UserIcon />
      <div>
        <span className="font-medium text-text-primary">
          {user.name || user.username || 'Unknown'}
        </span>
        {user.primaryEmail?.address && (
          <span className="text-text-muted ml-2">
            ({user.primaryEmail.address})
          </span>
        )}
      </div>
      <span className="ml-auto text-xs text-text-muted font-mono">
        via Apollo — shared context works!
      </span>
    </div>
  );
};

// ---- BOOKMARK LIST ----

export const BookmarkList = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [search, setSearch] = useState('');
  const { navigate } = usePluginRouter();

  useEffect(() => {
    setBookmarks(loadBookmarks());
  }, []);

  const filtered = bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.url.toLowerCase().includes(search.toLowerCase()) ||
      b.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
  );

  const handleDelete = (id: string) => {
    const updated = bookmarks.filter((b) => b._id !== id);
    saveBookmarks(updated);
    setBookmarks(updated);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Bookmarks</h1>
          <p className={styles.subtitle}>
            {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <button
          className={styles.btnPrimary}
          onClick={() => navigate('/new')}
        >
          <PlusIcon />
          Add Bookmark
        </button>
      </div>

      <CurrentUserBanner />

      <div className={styles.card}>
        <div className="p-4 border-b border-border-subtle">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              className={`${styles.input} pl-9`}
              placeholder="Search bookmarks by title, URL, or tag..."
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
                <p className="text-sm mb-4">
                  Create your first bookmark to get started.
                </p>
                <button
                  className={styles.btnPrimary}
                  onClick={() => navigate('/new')}
                >
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
                <th className={styles.th}>Title</th>
                <th className={styles.th}>URL</th>
                <th className={styles.th}>Tags</th>
                <th className={styles.th}>Created</th>
                <th className={`${styles.th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((bookmark) => (
                <tr
                  key={bookmark._id}
                  className="hover:bg-surface-raised transition-colors"
                >
                  <td className={styles.td}>
                    <span
                      className={`${styles.link} font-medium`}
                      onClick={() => navigate(`/${bookmark._id}`)}
                    >
                      {bookmark.title}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-accent hover:text-accent-hover"
                    >
                      <span className="truncate max-w-[250px] inline-block">
                        {bookmark.url}
                      </span>
                      <ExternalLinkIcon />
                    </a>
                  </td>
                  <td className={styles.td}>
                    <div className="flex flex-wrap gap-1">
                      {bookmark.tags.map((tag) => (
                        <span key={tag} className={styles.tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={`${styles.td} text-text-muted text-xs`}>
                    {new Date(bookmark.createdAt).toLocaleDateString()}
                  </td>
                  <td className={`${styles.td} text-right`}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className={styles.btnGhost}
                        onClick={() => navigate(`/${bookmark._id}`)}
                        title="Edit"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        className={`${styles.btnGhost} text-danger hover:text-danger`}
                        onClick={() => handleDelete(bookmark._id)}
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </div>
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

// ---- BOOKMARK FORM ----

interface BookmarkFormProps {
  initial?: Partial<Bookmark>;
  onSubmit: (data: Omit<Bookmark, '_id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  submitLabel: string;
}

const BookmarkForm = ({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: BookmarkFormProps) => {
  const [title, setTitle] = useState(initial?.title || '');
  const [url, setUrl] = useState(initial?.url || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [tagsInput, setTagsInput] = useState(initial?.tags?.join(', ') || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!url.trim()) errs.url = 'URL is required';
    else {
      try {
        new URL(url);
      } catch {
        errs.url = 'Must be a valid URL (include https://)';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      title: title.trim(),
      url: url.trim(),
      description: description.trim(),
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.card}>
        <div className={styles.cardBody}>
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Title <span className="text-danger">*</span>
              </label>
              <input
                className={`${styles.input} ${errors.title ? 'border-danger' : ''}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My awesome bookmark"
                autoFocus
              />
              {errors.title && (
                <p className="text-xs text-danger mt-1">{errors.title}</p>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                URL <span className="text-danger">*</span>
              </label>
              <input
                className={`${styles.input} ${errors.url ? 'border-danger' : ''}`}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
              {errors.url && (
                <p className="text-xs text-danger mt-1">{errors.url}</p>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Description</label>
              <textarea
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this bookmark about?"
                rows={3}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Tags</label>
              <input
                className={styles.input}
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Comma-separated tags, e.g. docs, api, reference"
              />
              <p className="text-xs text-text-muted mt-1">
                Separate multiple tags with commas
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border-subtle bg-surface-subtle">
          <button type="button" className={styles.btnSecondary} onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className={styles.btnPrimary}>
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
};

// ---- BOOKMARK CREATE ----

export const BookmarkCreate = () => {
  const { navigate } = usePluginRouter();

  const handleSubmit = (data: Omit<Bookmark, '_id' | 'createdAt' | 'updatedAt'>) => {
    const bookmarks = loadBookmarks();
    const now = new Date().toISOString();
    const newBookmark: Bookmark = {
      ...data,
      _id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    bookmarks.unshift(newBookmark);
    saveBookmarks(bookmarks);
    navigate(`/${newBookmark._id}`);
  };

  return (
    <div className={styles.page}>
      <button className={styles.backLink} onClick={() => navigate('')}>
        <ArrowLeftIcon />
        Back to Bookmarks
      </button>
      <div className={styles.header}>
        <h1 className={styles.title}>New Bookmark</h1>
      </div>
      <BookmarkForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('')}
        submitLabel="Create Bookmark"
      />
    </div>
  );
};

// ---- BOOKMARK DETAIL ----

export const BookmarkDetail = ({ entityId }: { entityId: string }) => {
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [editing, setEditing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const { navigate } = usePluginRouter();

  useEffect(() => {
    const bookmarks = loadBookmarks();
    const found = bookmarks.find((b) => b._id === entityId);
    if (found) {
      setBookmark(found);
    } else {
      setNotFound(true);
    }
  }, [entityId]);

  const handleUpdate = (data: Omit<Bookmark, '_id' | 'createdAt' | 'updatedAt'>) => {
    const bookmarks = loadBookmarks();
    const idx = bookmarks.findIndex((b) => b._id === entityId);
    if (idx === -1) return;
    bookmarks[idx] = {
      ...bookmarks[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveBookmarks(bookmarks);
    setBookmark(bookmarks[idx]);
    setEditing(false);
  };

  const handleDelete = () => {
    const bookmarks = loadBookmarks().filter((b) => b._id !== entityId);
    saveBookmarks(bookmarks);
    navigate('');
  };

  if (notFound) {
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

  if (!bookmark) return <div className="py-8 text-center text-text-muted">Loading...</div>;

  if (editing) {
    return (
      <div className={styles.page}>
        <button className={styles.backLink} onClick={() => setEditing(false)}>
          <ArrowLeftIcon />
          Cancel editing
        </button>
        <div className={styles.header}>
          <h1 className={styles.title}>Edit Bookmark</h1>
        </div>
        <BookmarkForm
          initial={bookmark}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          submitLabel="Save Changes"
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <button className={styles.backLink} onClick={() => navigate('')}>
        <ArrowLeftIcon />
        Back to Bookmarks
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>{bookmark.title}</h1>
        <div className="flex items-center gap-2">
          <button className={styles.btnSecondary} onClick={() => setEditing(true)}>
            <PencilIcon />
            Edit
          </button>
          <button className={styles.btnDanger} onClick={handleDelete}>
            <TrashIcon />
            Delete
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardBody}>
          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium text-text-muted uppercase tracking-wide">URL</span>
              <div className="mt-1">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-accent hover:text-accent-hover"
                >
                  {bookmark.url}
                  <ExternalLinkIcon />
                </a>
              </div>
            </div>

            {bookmark.description && (
              <div>
                <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Description</span>
                <p className="mt-1 text-sm text-text-primary whitespace-pre-wrap">
                  {bookmark.description}
                </p>
              </div>
            )}

            {bookmark.tags.length > 0 && (
              <div>
                <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Tags</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {bookmark.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.separator} />

            <div className="flex gap-6 text-xs text-text-muted">
              <div>
                <span className="font-medium">Created:</span>{' '}
                {new Date(bookmark.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Updated:</span>{' '}
                {new Date(bookmark.updatedAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">ID:</span>{' '}
                <code className="font-mono">{bookmark._id}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- DASHBOARD WIDGET ----

export const BookmarkWidget = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const { navigate } = usePluginRouter();

  useEffect(() => {
    setBookmarks(loadBookmarks().slice(0, 5));
  }, []);

  return (
    <div className={styles.card}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle">
        <h3 className="text-sm font-semibold text-text-primary">Recent Bookmarks</h3>
        <button
          className="text-xs text-accent hover:text-accent-hover"
          onClick={() => navigate('')}
        >
          View all
        </button>
      </div>
      {bookmarks.length === 0 ? (
        <div className="p-5 text-center text-sm text-text-muted">No bookmarks yet</div>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {bookmarks.map((b) => (
            <li
              key={b._id}
              className="px-5 py-3 hover:bg-surface-raised transition-colors cursor-pointer"
              onClick={() => navigate(`/${b._id}`)}
            >
              <div className="text-sm font-medium text-text-primary truncate">{b.title}</div>
              <div className="text-xs text-text-muted truncate">{b.url}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
