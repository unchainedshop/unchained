import classNames from 'classnames';
import { useIntl } from 'react-intl';
import SubmitButton from '../../forms/components/SubmitButton';

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
      className={classNames(
        'flex shrink-0 items-center space-x-4 py-5 pl-1',
        className,
      )}
    >
      {showCancel ? (
        <button
          onClick={onCancel}
          data-id="cancel_update"
          type="button"
          className={classNames(
            'focus:ring-slate-800',
            'inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-800 focus:ring-offset-2',
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
