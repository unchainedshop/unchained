import { useIntl } from 'react-intl';
import {
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  PuzzlePieceIcon,
} from '@heroicons/react/20/solid';

import { toast } from 'react-toastify';
import SelectOptions from '../../common/components/SelectOptions';
import Tab from '../../common/components/Tab';
import FilterTextForm from './FilterTextForm';
import FilterOptions from './FilterOptions';
import FilterSummary from './FilterSummary';
import useUpdateFilter from '../hooks/useUpdateFilter';
import DisplayExtendedFields from '../../common/components/DisplayExtendedFields';
import LocaleWrapper from '../../common/components/LocaleWrapper';

const GetCurrentTab = ({ selectedView, id, ...extendedData }) => {
  if (selectedView === 'text')
    return (
      <LocaleWrapper>
        <FilterTextForm filterId={id} />
      </LocaleWrapper>
    );

  if (selectedView === 'options')
    return (
      <LocaleWrapper>
        <FilterOptions filterId={id} />
      </LocaleWrapper>
    );
  if (selectedView === 'extended')
    return <DisplayExtendedFields data={extendedData} />;
  return (
    <LocaleWrapper>
      <FilterTextForm filterId={id} />
    </LocaleWrapper>
  );
};

const FilterDetail = ({ filter, extendedData }) => {
  const { _id: filterId, isActive, key, type, created, updated } = filter || {};
  const { formatMessage, formatDate } = useIntl();
  const { updateFilter } = useUpdateFilter();

  const filterOptions = [
    {
      id: 'text',
      title: formatMessage({
        id: 'text',
        defaultMessage: 'Text',
      }),
      Icon: <DocumentTextIcon className="h-5 w-5" />,
    },

    {
      id: 'options',
      title: formatMessage({
        id: 'options',
        defaultMessage: 'Options',
      }),
      Icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
    },
    extendedData !== null && {
      id: 'extended',
      title: formatMessage({
        id: 'extended-fields',
        defaultMessage: 'Extended',
      }),
      Icon: <PuzzlePieceIcon className="h-5 w-5" />,
    },
  ].filter(Boolean);

  const activeOptions = [
    {
      id: 'activate',
      title: formatMessage({
        id: 'activate',
        defaultMessage: 'Activate',
      }),
      selectedTitle: formatMessage({
        id: 'active',
        defaultMessage: 'Active',
      }),
      onClick: async () => {
        await updateFilter({
          filterId,
          filter: { isActive: true },
        });
        toast.success(
          formatMessage({
            id: 'filter_activated',
            defaultMessage: 'Filter activated!',
            description: 'shown on successful toggle of filter status',
          }),
        );
      },

      current: isActive,
      bgColor: 'green',
    },
    {
      id: 'deactivate',
      title: formatMessage({
        id: 'deactivate',
        defaultMessage: 'Deactivate',
      }),
      onClick: async () => {
        await updateFilter({
          filterId,
          filter: { isActive: false },
        });
        toast.success(
          formatMessage({
            id: 'filter_deactivated',
            defaultMessage: 'Filter deactivated!',
            description: 'shown on successful toggle of filter status',
          }),
        );
      },
      selectedTitle: formatMessage({
        id: 'deactivated',
        defaultMessage: 'Deactivated',
      }),

      current: !isActive,
      bgColor: 'slate',
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <FilterSummary filterKey={key} filterType={type} />
        </div>
        <div className="self-end">
          <SelectOptions
            options={activeOptions}
            type={formatMessage({ id: 'filter', defaultMessage: 'Filter' })}
          />
        </div>
      </div>

      <Tab tabItems={filterOptions} defaultTab="text">
        <GetCurrentTab id={filter?._id} {...extendedData} />
      </Tab>
    </>
  );
};

export default FilterDetail;
