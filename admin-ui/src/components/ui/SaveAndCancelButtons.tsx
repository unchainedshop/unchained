import clsx from 'clsx';
import { useIntl } from 'react-intl';
import SubmitButton from './form/SubmitButton';

const SaveAndCancelButtons = ({
  cancelText = null,
  showCancel = true,
  submitText = null,
  showSubmit = true,
  onCancel,
  className = '',
}) => {
  const { formatMessage } = useIntl();
  return (
    <span
      className={clsx(
        'flex shrink-0 items-center space-x-4 py-5 pl-1',
        className,
      )}
    >
      {showCancel ? (
        <button
          onClick={onCancel}
          data-id="cancel_update"
          type="button"
          className={clsx(
            'focus:ring-slate-800',
            'inline-flex items-center rounded-md border border-border-default bg-surface px-4 py-2 text-sm font-medium text-text-secondary shadow-xs hover:bg-surface-raised focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:ring-offset-2',
          )}
        >
          {cancelText ||
            formatMessage({
              id: 'cancel',
              defaultMessage: 'Cancel',
            })}
        </button>
      ) : null}
      {showSubmit ? (
        <SubmitButton
          label={
            submitText ||
            formatMessage({
              id: 'save',
              defaultMessage: 'Save',
            })
          }
        />
      ) : null}
    </span>
  );
};

export default SaveAndCancelButtons;
