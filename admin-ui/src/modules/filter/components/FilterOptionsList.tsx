import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';

import useRemoveFilterOption from '../hooks/useRemoveFilterOption';
import useModal from '../../modal/hooks/useModal';
import DangerMessage from '../../modal/components/DangerMessage';
import FilterOptionsListItem from './FilterOptionsListItem';
import useApp from '../../common/hooks/useApp';

const FilterOptionsList = ({ filterId, options }) => {
  const { formatMessage } = useIntl();
  const { setModal } = useModal();
  const { selectedLocale } = useApp();
  const { removeFilterOption } = useRemoveFilterOption();

  const onRemoveFilterOption = async (filterOptionValue) => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_filter_option_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this filter option? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removeFilterOption({ filterId, filterOptionValue });
          toast.success(
            formatMessage({
              id: 'filter_deleted',
              defaultMessage: 'Filter deleted successfully',
            }),
          );
        }}
        okText={formatMessage({
          id: 'delete_filter_option',
          defaultMessage: 'Delete option',
        })}
      />,
    );
  };

  return (
    <div>
      <ul className="-my-5 divide-y divide-slate-200 dark:divide-slate-700 pb-3 ">
        {options.map((option) => (
          <FilterOptionsListItem
            filterId={filterId}
            key={`${option._id}${selectedLocale}`}
            option={option}
            onDelete={onRemoveFilterOption}
          />
        ))}
      </ul>
    </div>
  );
};

export default FilterOptionsList;
