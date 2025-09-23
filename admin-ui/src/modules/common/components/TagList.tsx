import { useIntl } from 'react-intl';
import useModal from '../../modal/hooks/useModal';

import Badge from './Badge';
import TagListForm from './TagListForm';

const TagList = ({
  defaultValue,
  onSubmit,
  enableEdit,
  availableTagOptions = [],
}) => {
  const { formatMessage } = useIntl();
  const { setModal } = useModal();

  return (
    <div className="flex items-center mr-auto gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {defaultValue?.length ? (
          defaultValue.map((tag, key) => (
            <span key={`${tag}${key + 1}`}>
              <Badge text={tag} color="sky" />
            </span>
          ))
        ) : (
          <span>
            <Badge
              text={formatMessage({ id: 'no_tag', defaultMessage: 'No Tag' })}
              color="slate"
            />
          </span>
        )}
      </div>
      {enableEdit && (
        <button
          id="add_tag"
          type="button"
          className="rounded-sm hover:shadow-sm px-3 py-2 text-xs inline-flex items-center justify-center text-slate-800 hover:text-slate-900 hover:bg-slate-50 hover:border border-transparent border-1 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-800"
          onClick={() =>
            setModal(
              <TagListForm
                tags={defaultValue || []}
                onCancel={() => setModal('')}
                onSubmit={onSubmit}
                selectOptions={availableTagOptions}
              />,
            )
          }
        >
          {formatMessage({
            id: 'edit_tags',
            defaultMessage: 'Edit tags',
          })}
        </button>
      )}
    </div>
  );
};

export default TagList;
