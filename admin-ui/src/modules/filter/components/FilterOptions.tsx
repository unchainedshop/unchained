import { useIntl } from 'react-intl';
import SelfDocumentingView from '../../common/components/SelfDocumentingView';
import { OnSubmitType } from '../../forms/hooks/useForm';

import useModal from '../../modal/hooks/useModal';
import useCreateFilterOption from '../hooks/useCreateFilterOption';
import useFilterOptions from '../hooks/useFilterOptions';
import FilterOptionForm from './FilterOptionForm';

import FilterOptionsList from './FilterOptionsList';
import useAuth from '../../Auth/useAuth';
import useApp from '../../common/hooks/useApp';

const FilterOptions = ({ filterId }) => {
  const { formatMessage } = useIntl();
  const { selectedLocale } = useApp();
  const { filterOptions } = useFilterOptions({
    filterId,
    locale: selectedLocale,
  });
  const { setModal } = useModal();

  const { createFilterOption } = useCreateFilterOption();
  const { hasRole } = useAuth();
  const onSubmit: OnSubmitType = async ({ value, title, subtitle }) => {
    await createFilterOption({
      filterId,
      option: value,
      texts: [{ title, locale: selectedLocale, subtitle }],
    });
    setModal('');
    return { success: true };
  };

  return (
    <SelfDocumentingView
      documentationLabel={formatMessage({
        id: 'filer_options',
        defaultMessage: 'Filter options',
      })}
      sideComponents={
        hasRole('manageFilters') ? (
          <button
            type="button"
            onClick={() =>
              setModal(
                <FilterOptionForm
                  onSubmit={onSubmit}
                  onCancel={() => setModal('')}
                />,
              )
            }
            className="fixed top-0 right-0 z-10 mb-5 mt-5 mr-2 h-9 rounded-md border border-transparent bg-slate-800 dark:bg-slate-600 px-3 py-1 text-sm font-medium leading-5 text-white shadow-xs hover:bg-slate-950 dark:hover:bg-slate-500 focus:outline-hidden focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-400 sm:fixed sm:top-auto sm:right-auto"
          >
            {formatMessage({
              id: 'add_filter_option',
              defaultMessage: 'Add option',
            })}
          </button>
        ) : null
      }
    >
      <div className="mt-8 w-full border-slate-300 dark:border-slate-800 p-3 sm:mt-0 shadow-md  bg-white dark:bg-slate-900">
        <FilterOptionsList filterId={filterId} options={filterOptions} />
      </div>
    </SelfDocumentingView>
  );
};

export default FilterOptions;
