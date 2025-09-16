import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import ListHeader from '../../modules/common/components/ListHeader';
import InfiniteScroll from '../../modules/common/components/InfiniteScroll';
import Loading from '../../modules/common/components/Loading';
import PageHeader from '../../modules/common/components/PageHeader';
import Toggle from '../../modules/common/components/Toggle';

import { DefaultLimit } from '../../modules/common/data/miscellaneous';
import CountryList from '../../modules/country/components/CountryList';
import useCountries from '../../modules/country/hooks/useCountries';

import useRemoveCountry from '../../modules/country/hooks/useRemoveCountry';
import DangerMessage from '../../modules/modal/components/DangerMessage';
import useModal from '../../modules/modal/hooks/useModal';

import useAuth from '../../modules/Auth/useAuth';
import {
  convertSortFieldsToQueryFormat,
  normalizeQuery,
} from '../../modules/common/utils/utils';
import SearchWithTags from '../../modules/common/components/SearchWithTags';
import CountryDetailPage from './CountryDetailPage';
import AnimatedCounter from '../../modules/common/components/AnimatedCounter';
import InfoTextBanner from '../../modules/common/components/InfoTextBanner';

const Country = () => {
  const { formatMessage } = useIntl();
  const { query, push } = useRouter();
  const limit = parseInt(query?.limit as string, 10) || DefaultLimit;
  const offset = parseInt(query?.skip as string, 10) || 0;
  const sort = query?.sort || '';
  const includeInactive =
    query?.includeInactive === 'true' || !query?.includeInactive;
  const { hasRole } = useAuth();

  const { queryString, countryId, ...restQuery } = query;

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

  const { countries, countriesCount, loading, loadMore, hasMore } =
    useCountries({
      queryString: queryString as string,
      limit,
      includeInactive,
      offset,
      sort: sortKeys,
    });

  const { setModal } = useModal();
  const { removeCountry } = useRemoveCountry();

  const onRemoveCountry = async (countryId) => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_country_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this country? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removeCountry({ countryId });
          toast.success(
            formatMessage({
              id: 'country_deleted',
              defaultMessage: 'Country deleted successfully',
            }),
          );
        }}
        okText={formatMessage({
          id: 'delete_country',
          defaultMessage: 'Delete country',
        })}
      />,
    );
  };

  if (countryId) return <CountryDetailPage countryId={countryId} />;

  const headerText =
    countriesCount === 1
      ? formatMessage({
          id: 'country_header',
          defaultMessage: '1 Country',
        })
      : formatMessage(
          {
            id: 'country_count_header',
            defaultMessage: '{count} Countries',
          },
          { count: <AnimatedCounter value={countriesCount} /> },
        );

  return (
    <>
      <BreadCrumbs />
      <InfoTextBanner
        title={formatMessage({
          id: 'default_country_info_title',
          defaultMessage: 'About base country',
        })}
        description={formatMessage({
          id: 'default_country_info_description',
          defaultMessage:
            'If you support multiple countries, please set the base country by adjusting the environment variable UNCHAINED_COUNTRY, for ex. UNCHAINED_COUNTRY=ch. That way, Unchained knows what localization needs to be sent if it can not determine country from user agent set header',
        })}
      />
      <PageHeader
        title={formatMessage(
          {
            id: 'countries_page_title',
            defaultMessage:
              '{count, plural, one {# Country} other {# Countries}}',
          },
          { count: countriesCount },
        )}
        headerText={headerText}
        addPath={hasRole('addCountry') && '/country/new'}
        addButtonText={formatMessage({
          id: 'add_country',
          defaultMessage: 'Add Country',
        })}
      />
      <div className="min-w-full overflow-x-auto px-1">
        <ListHeader>
          <Toggle
            toggleText={formatMessage({
              id: 'show_inactive',
              defaultMessage: 'Show Inactive',
            })}
            toggleKey="includeInactive"
            active={includeInactive}
          />
        </ListHeader>
        <SearchWithTags
          onSearchChange={setQueryString}
          defaultSearchValue={queryString}
        >
          <InfiniteScroll
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
          >
            {loading && countries?.length === 0 ? (
              <Loading />
            ) : (
              <CountryList
                sortable
                countries={countries}
                onRemoveCountry={onRemoveCountry}
              />
            )}
          </InfiniteScroll>
        </SearchWithTags>
      </div>
    </>
  );
};

export default Country;
