import { useIntl } from 'react-intl';

const StatusFilter = ({ selectedStatuses = [], onStatusChange, statuses }) => {
  const { formatMessage } = useIntl();
  const selected = Array.isArray(selectedStatuses) ? selectedStatuses : [];

  const getStatusTranslation = (status) => {
    const translationKey = status.toLowerCase();
    return formatMessage({
      id: translationKey,
      defaultMessage: status,
    });
  };

  const statusChangeHandler = (event) => {
    const { value, checked } = event.target;
    const newSelectedStatus = checked
      ? [...selected, value]
      : selected.filter((s) => s !== value);
    onStatusChange(newSelectedStatus);
  };

  return statuses?.map((status) => (
    <div
      className="inline-flex items-center rounded-md py-2 text-sm font-medium text-slate-900"
      key={status}
    >
      <input
        className="h-4 w-4 rounded-sm border-border-default bg-white dark:!bg-slate-800 text-slate-950 focus:ring-focus-ring"
        type="checkbox"
        id={status}
        name={status}
        value={status}
        checked={selected.includes(status)}
        onChange={statusChangeHandler}
      />
      <div className="ml-2">
        <label
          className="text-sm text-slate-600 dark:text-slate-200"
          htmlFor={status}
        >
          {getStatusTranslation(status)}
        </label>
      </div>
    </div>
  ));
};

export default StatusFilter;
