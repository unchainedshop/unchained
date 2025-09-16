import { useState } from 'react';
import { useIntl } from 'react-intl';

const StatusFilter = ({ selectedStatuses, onStatusChange, statuses }) => {
  const { formatMessage } = useIntl();
  const [selectedStatus, setSelectedStatus] = useState(selectedStatuses || []);

  // Function to get translated status text
  const getStatusTranslation = (status) => {
    // Convert status to lowercase for translation key
    const translationKey = status.toLowerCase();
    return formatMessage({
      id: translationKey,
      defaultMessage: status,
    });
  };

  const statusChangeHandler = (event) => {
    const { value, checked } = event.target;
    let newSelectedStatus;
    if (checked) {
      newSelectedStatus = [...selectedStatus, value];
    } else {
      newSelectedStatus = selectedStatus.filter((status) => status !== value);
    }
    setSelectedStatus(newSelectedStatus);
    onStatusChange(newSelectedStatus);
  };

  return statuses?.map((status) => (
    <div
      className="inline-flex items-center rounded-md py-2 text-sm font-medium text-slate-900"
      key={status}
    >
      <input
        className="h-4 w-4 rounded-sm border-slate-300 dark:border-slate-600 bg-white dark:!bg-slate-800 text-slate-950 focus:ring-slate-800"
        type="checkbox"
        id={status}
        name={status}
        value={status}
        checked={selectedStatus.includes(status)}
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
