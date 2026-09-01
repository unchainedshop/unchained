import React, { useState } from 'react';
import { useIntl } from 'react-intl';

export interface BulkTagData {
  add?: string[];
  remove?: string[];
}

interface BulkTagFormProps {
  onSubmit: (data: BulkTagData) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const BulkTagForm: React.FC<BulkTagFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const { formatMessage } = useIntl();
  const [addTags, setAddTags] = useState('');
  const [removeTags, setRemoveTags] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const add = [
      ...new Set(
        addTags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
    const remove = [
      ...new Set(
        removeTags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
    void onSubmit({
      add: add.length ? add : undefined,
      remove: remove.length ? remove : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="bulk-add-tags"
          className="text-xs text-slate-500 dark:text-slate-300"
        >
          {formatMessage({
            id: 'bulk_add_tags',
            defaultMessage: 'Add tags (comma-separated)',
          })}
        </label>
        <input
          id="bulk-add-tags"
          type="text"
          value={addTags}
          disabled={loading}
          onChange={(e) => setAddTags(e.target.value)}
          placeholder="tag1, tag2"
          className="text-sm px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 text-slate-900 dark:text-white placeholder:text-slate-400 w-48"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label
          htmlFor="bulk-remove-tags"
          className="text-xs text-slate-500 dark:text-slate-300"
        >
          {formatMessage({
            id: 'bulk_remove_tags',
            defaultMessage: 'Remove tags (comma-separated)',
          })}
        </label>
        <input
          id="bulk-remove-tags"
          type="text"
          value={removeTags}
          disabled={loading}
          onChange={(e) => setRemoveTags(e.target.value)}
          placeholder="tag1, tag2"
          className="text-sm px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-500 text-slate-900 dark:text-white placeholder:text-slate-400 w-48"
        />
      </div>
      <button
        type="submit"
        disabled={loading || (!addTags.trim() && !removeTags.trim())}
        className="text-xs font-medium px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-900 text-white dark:bg-white/10 dark:hover:bg-white/20 disabled:opacity-50"
      >
        {formatMessage({ id: 'apply', defaultMessage: 'Apply' })}
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={onCancel}
        className="text-xs font-medium px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300"
      >
        {formatMessage({ id: 'cancel', defaultMessage: 'Cancel' })}
      </button>
    </form>
  );
};

export default BulkTagForm;
