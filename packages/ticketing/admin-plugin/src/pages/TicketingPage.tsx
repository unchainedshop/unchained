import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import {
  Loading,
  NoData,
  PageHeader,
  ListHeader,
  AnimatedCounter,
  SearchField,
  Pagination,
} from '@unchainedshop/admin-ui/ui';
import TicketEventList from '../components/TicketEventList.tsx';
import useEventProducts from '../hooks/useEventProducts.ts';
import { EVENT_LIST_PERIODS, getEventListFilter, type EventListPeriod } from '../utils/dates.ts';
import { DefaultLimit } from '../utils/misc.ts';

const TicketingPage = () => {
  const { formatMessage } = useIntl();
  const { query, push } = useRouter();

  const { queryString, ...rest } = query;
  const period = (
    EVENT_LIST_PERIODS.includes(query.period as EventListPeriod) ? query.period : 'upcoming'
  ) as EventListPeriod;
  const limit = parseInt(query.limit as string, 10) || DefaultLimit;
  const offset = parseInt(query.skip as string, 10) || 0;

  const setQueryString = (searchString) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { skip, ...withoutSkip } = rest;
    if (searchString)
      push({
        query: {
          ...withoutSkip,
          queryString: searchString,
        },
      });
    else
      push({
        query: {
          ...rest,
        },
      });
  };

  const setPeriod = (nextPeriod: EventListPeriod) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { skip, ...withoutSkip } = query;
    push({ query: { ...withoutSkip, period: nextPeriod } });
  };

  // Day-granular dates, so the query variables stay the same while the page is open.
  const { slotFrom, slotTo, sort } = getEventListFilter(period, new Date());
  const { products, productsCount, loading } = useEventProducts({
    limit,
    offset,
    queryString: queryString as string,
    slotFrom,
    slotTo,
    sort,
  });

  const periodLabels: Record<EventListPeriod, string> = {
    upcoming: formatMessage({ id: 'events_upcoming', defaultMessage: 'Upcoming' }),
    past: formatMessage({ id: 'events_past', defaultMessage: 'Past' }),
    all: formatMessage({ id: 'events_all', defaultMessage: 'All' }),
  };

  const headerText =
    productsCount === 1
      ? formatMessage({
          id: 'event_header',
          defaultMessage: '1 Event',
        })
      : formatMessage(
          {
            id: 'event_count_header',
            defaultMessage: '{count} Events',
          },
          { count: <AnimatedCounter value={productsCount} /> },
        );

  return (
    <>
      <PageHeader
        title={formatMessage(
          {
            id: 'ticketing_page_title',
            defaultMessage: '{count, plural, one {# Event} other {# Events}}',
          },
          { count: productsCount },
        )}
        headerText={headerText}
      />
      <div className="mt-5 inline-block min-w-full overflow-x-auto px-1 pb-5">
        <ListHeader />
        <div className="my-3 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-md shadow-xs" role="group">
            {EVENT_LIST_PERIODS.map((option, index) => (
              <button
                key={option}
                type="button"
                aria-pressed={period === option}
                onClick={() => setPeriod(option)}
                className={[
                  'border border-border-default px-4 py-2 text-sm font-medium',
                  index === 0 ? 'rounded-l-md' : '',
                  index === EVENT_LIST_PERIODS.length - 1 ? 'rounded-r-md' : '',
                  period === option
                    ? 'bg-slate-800 text-white'
                    : 'bg-surface text-text-secondary hover:bg-surface-raised',
                ].join(' ')}
              >
                {periodLabels[option]}
              </button>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <SearchField onInputChange={setQueryString} defaultValue={queryString} />
          </div>
        </div>
        {period !== 'all' && (
          <p className="mb-3 text-xs text-text-muted">
            {formatMessage({
              id: 'events_without_date_hint',
              defaultMessage: 'Events without a start date are listed under All.',
            })}
          </p>
        )}
        {loading && !products.length ? <Loading /> : <TicketEventList products={products} />}
        {!loading && !products?.length && (
          <NoData
            message={formatMessage({
              id: 'no_events_noun',
              defaultMessage: 'events',
            })}
          />
        )}
        {productsCount > 0 && <Pagination total={productsCount} data={products} />}
      </div>
    </>
  );
};

export default TicketingPage;
