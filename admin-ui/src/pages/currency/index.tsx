import { useIntl } from 'react-intl';
import { IRoleAction } from '../../gql/types';

import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

import { DefaultLimit } from '../../modules/common/data/miscellaneous';
import CurrencyList from '../../modules/currency/components/CurrencyList';
import useCurrencies from '../../modules/currency/hooks/useCurrencies';
import useRemoveCurrency from '../../modules/currency/hooks/useRemoveCurrency';
import BreadCrumbs from '../../modules/common/components/BreadCrumbs';
import PageHeader from '../../modules/common/components/PageHeader';
import ListHeader from '../../modules/common/components/ListHeader';
import Toggle from '../../modules/common/components/Toggle';
import InfiniteScroll from '../../modules/common/components/InfiniteScroll';
import DangerMessage from '../../modules/modal/components/DangerMessage';
import useModal from '../../modules/modal/hooks/useModal';
import Loading from '../../modules/common/components/Loading';
import useAuth from '../../modules/Auth/useAuth';
import {
  convertSortFieldsToQueryFormat,
  normalizeQuery,
} from '../../modules/common/utils/utils';
import SearchWithTags from '../../modules/common/components/SearchWithTags';
import CurrencyDetailPage from './CurrencyDetailPage';
import AnimatedCounter from '../../modules/common/components/AnimatedCounter';
import InfoTextBanner from '../../modules/common/components/InfoTextBanner';

const Currencies = () => {
  const { formatMessage } = useIntl();
  const { query, push } = useRouter();
  const { hasRole } = useAuth();
  const limit = parseInt(query?.limit as string, 10) || DefaultLimit;
  const offset = parseInt(query?.skip as string, 10) || 0;
  const includeInactive =
    query?.includeInactive === 'true' || !query?.includeInactive;
  const sort = query?.sort || '';

  const { queryString, currencyId, ...restQuery } = query;

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

  const { currencies, currenciesCount, loading, loadMore, hasMore } =
    useCurrencies({
      queryString: queryString as string,
      limit,
      offset,
      includeInactive,
      sort: sortKeys,
    });

  const { setModal } = useModal();
  const { removeCurrency } = useRemoveCurrency();

  const onRemove = async (currencyId) => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_currency_confirmation',
          defaultMessage:
            'This action might cause inconsistencies with other data that relates to it. Are you sure you want to delete this currency? ',
        })}
        onOkClick={async () => {
          setModal('');
          await removeCurrency({ currencyId });
          toast.success(
            formatMessage({
              id: 'currency_deleted',
              defaultMessage: 'Currency deleted successfully',
            }),
          );
        }}
        okText={formatMessage({
          id: 'delete_currency',
          defaultMessage: 'Delete currency',
        })}
      />,
    );
  };

  if (currencyId) return <CurrencyDetailPage currencyId={currencyId} />;

  const headerText =
    currenciesCount === 1
      ? formatMessage({
          id: 'currency_header',
          defaultMessage: '1 Currency',
        })
      : formatMessage(
          {
            id: 'currency_count_header',
            defaultMessage: '{count} Currencies',
          },
          { count: <AnimatedCounter value={currenciesCount} /> },
        );
  return (
    <>
      <BreadCrumbs />
      <InfoTextBanner
        title={formatMessage({
          id: 'default_currency_info_title',
          defaultMessage: 'About base currency',
        })}
        description={formatMessage({
          id: 'default_currency_info_description',
          defaultMessage:
            'Please set the base currency by adjusting the environment variable UNCHAINED_CURRENCY, for ex. UNCHAINED_CURRENCY=CHF. That way, Unchained knows what currency to use as a fallback if it is unable to determine it from context',
        })}
      />
      <PageHeader
        title={formatMessage(
          {
            id: 'currencies_page_title',
            defaultMessage:
              '{count, plural, one {# Currency} other {# Currencies}}',
          },
          { count: currenciesCount },
        )}
        headerText={headerText}
        addPath={hasRole(IRoleAction.ManageCurrencies) && '/currency/new'}
        addButtonText={formatMessage({
          id: 'add_currency',
          defaultMessage: 'Add Currency',
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
            {loading && currencies?.length === 0 ? (
              <Loading />
            ) : (
              <CurrencyList
                currencies={currencies}
                onRemoveCurrency={onRemove}
                sortable
              />
            )}
          </InfiniteScroll>
        </SearchWithTags>
      </div>
    </>
  );
};

export default Currencies;
