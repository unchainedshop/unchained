import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import TagInput, { type TagOption } from '@/components/ui/Tag/TagInput';

export interface BulkTagData {
  add?: string[];
  remove?: string[];
}

interface BulkTagFormProps {
  onSubmit: (data: BulkTagData) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  availableTagOptions?: TagOption[];
}

const BulkTagForm: React.FC<BulkTagFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
  availableTagOptions = [],
}) => {
  const { formatMessage } = useIntl();
  const [addTags, setAddTags] = useState<string[]>([]);
  const [removeTags, setRemoveTags] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const add = [
      ...new Set(addTags.map((t) => t.trim().toLowerCase()).filter(Boolean)),
    ];
    const remove = [
      ...new Set(removeTags.map((t) => t.trim().toLowerCase()).filter(Boolean)),
    ];
    void onSubmit({
      add: add.length ? add : undefined,
      remove: remove.length ? remove : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex w-56 flex-col gap-1">
        <label
          htmlFor="bulk-add-tags"
          className="text-xs text-slate-500 dark:text-slate-300"
        >
          {formatMessage({
            id: 'bulk_add_tags',
            defaultMessage: 'Add tags',
          })}
        </label>
        <TagInput
          id="bulk-add-tags"
          name="bulk-add-tags"
          tagList={addTags}
          disabled={loading}
          onChange={setAddTags}
          selectOptions={availableTagOptions}
          placeholder={formatMessage({
            id: 'enter_tag',
            defaultMessage: 'Enter tag...',
          })}
        />
      </div>
      <div className="flex w-56 flex-col gap-1">
        <label
          htmlFor="bulk-remove-tags"
          className="text-xs text-slate-500 dark:text-slate-300"
        >
          {formatMessage({
            id: 'bulk_remove_tags',
            defaultMessage: 'Remove tags',
          })}
        </label>
        <TagInput
          id="bulk-remove-tags"
          name="bulk-remove-tags"
          tagList={removeTags}
          disabled={loading}
          onChange={setRemoveTags}
          selectOptions={availableTagOptions}
          placeholder={formatMessage({
            id: 'enter_tag',
            defaultMessage: 'Enter tag...',
          })}
        />
      </div>
      <button
        type="submit"
        disabled={loading || (!addTags.length && !removeTags.length)}
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
