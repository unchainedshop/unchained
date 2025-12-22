import { useIntl } from 'react-intl';
import { IRoleAction } from '../../gql/types';

import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import ListHeader from '../../modules/common/components/ListHeader';
import PageHeader from '../../modules/common/components/PageHeader';
import Toggle from '../../modules/common/components/Toggle';
import { DefaultLimit } from '../../modules/common/data/miscellaneous';
import FilterList from '../../modules/filter/components/FilterList';
import DangerMessage from '../../modules/modal/components/DangerMessage';
import useModal from '../../modules/modal/hooks/useModal';
import useRemoveFilter from '../../modules/filter/hooks/useRemoveFilter';
import useAuth from '../../modules/Auth/useAuth';
import {
  convertSortFieldsToQueryFormat,
  normalizeQuery,
} from '../../modules/common/utils/utils';
import SearchWithTags from '../../modules/common/components/SearchWithTags';
import useFiltersCount from '../../modules/filter/hooks/useFiltersCount';
import FilterDetailPage from './FilterDetailPage';
import LocaleWrapper from '../../modules/common/components/LocaleWrapper';
import AnimatedCounter from '../../modules/common/components/AnimatedCounter';
import FilterExport from '../../modules/filter/components/FilterExport';
import FilterImport from '../../modules/filter/components/FilterImport';

const FiltersListView = () => {
  const { query, push } = useRouter();
  const limit = parseInt(query?.limit as string, 10) || DefaultLimit;
  const offset = parseInt(query?.skip as string, 10) || 0;
  const sort = query?.sort || '';
  const { hasRole } = useAuth();
  const includeInactive =
    query?.includeInactive === 'true' || !query?.includeInactive;
  const { setModal } = useModal();
  const { removeFilter } = useRemoveFilter();

  const { queryString, filterId, ...restQuery } = query;
  const { filtersCount } = useFiltersCount({
    queryString: queryString as string,
    includeInactive,
  });

  const setQueryString = (searchString) => {
    const { skip, ...withoutSkip } = restQuery;
    if (searchString) {
      push({
        query: normalizeQuery(withoutSkip, searchString, 'queryString'),
      });
    } else {
      push({
        query: normalizeQuery(restQuery),
      });
    }
  };
  const sortKeys = convertSortFieldsToQueryFormat(sort);
  const { formatMessage } = useIntl();

  const onRemoveFilter = async (filterId) => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_filter_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this filter? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removeFilter({ filterId });
          toast.success(
            formatMessage({
              id: 'filter_deleted',
              defaultMessage: 'Filter deleted successfully',
            }),
          );
        }}
        okText={formatMessage({
          id: 'delete_filter',
          defaultMessage: 'Delete filter',
        })}
      />,
    );
  };

  if (filterId) return <FilterDetailPage filterId={filterId} />;

  const headerText =
    filtersCount === 1
      ? formatMessage({
          id: 'filter_header',
          defaultMessage: '1 Filter',
        })
      : formatMessage(
          {
            id: 'filter_count_header',
            defaultMessage: '{count} Filters',
          },
          { count: <AnimatedCounter value={filtersCount} /> },
        );
  return (
    <>
      <BreadCrumbs />
      <div className="w-full">
        <PageHeader
          title={formatMessage(
            {
              id: 'filter_page_title',
              defaultMessage:
                '{count, plural, one {# Filter} other {# Filters}}',
            },
            { count: filtersCount },
          )}
          headerText={headerText}
          addPath={hasRole(IRoleAction.ManageFilters) && '/filters/new'}
          addButtonText={formatMessage({
            id: 'add_filter',
            defaultMessage: 'Add Filter',
          })}
        >
          <FilterExport
            queryString={queryString}
            includeInactive={includeInactive}
          />
          <FilterImport />
        </PageHeader>
      </div>

      <div className="min-w-full overflow-x-auto px-1">
        <ListHeader>
          <Toggle
            toggleText={formatMessage({
              id: 'include_inactive',
              defaultMessage: 'Include inactive',
            })}
            toggleKey="includeInactive"
            active={includeInactive}
          />
        </ListHeader>

        <SearchWithTags
          onSearchChange={setQueryString}
          defaultSearchValue={queryString}
        >
          <LocaleWrapper onlyFull>
            <FilterList
              onRemoveFilter={onRemoveFilter}
              {...{ queryString, limit, includeInactive, offset, sortKeys }}
            />
          </LocaleWrapper>
        </SearchWithTags>
      </div>
    </>
  );
};

export default FiltersListView;
