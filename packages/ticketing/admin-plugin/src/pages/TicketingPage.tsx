import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import { useAuth } from '@unchainedshop/admin-ui/hooks';
import {
  BreadCrumbs,
  Loading,
  NoData,
  PageHeader,
  ListHeader,
  AnimatedCounter,
  SearchField,
  Pagination,
} from '@unchainedshop/admin-ui/ui';
import TicketEventList from '../components/TicketEventList.tsx';
import TicketProductionList from '../components/production/TicketProductionList.tsx';
import useEventProducts from '../hooks/useEventProducts.ts';
import useTicketProductions from '../hooks/useTicketProductions.ts';
import { EVENT_LIST_PERIODS, getEventListFilter, type EventListPeriod } from '../utils/dates.ts';
import { DefaultLimit } from '../utils/misc.ts';

// Productions with their dates, single events, or every performance and event by date.
const VIEWS = ['productions', 'events', 'performances'] as const;
type View = (typeof VIEWS)[number];

const TicketingPage = () => {
  const { formatMessage } = useIntl();
  const { query, push } = useRouter();
  const { hasRole } = useAuth();

  const { queryString, ...rest } = query;
  const view = (VIEWS.includes(query.view as View) ? query.view : 'productions') as View;
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
  const events = useEventProducts({
    limit,
    offset,
    queryString: queryString as string,
    slotFrom,
    slotTo,
    sort,
    standalone: view === 'events',
  });
  const productionList = useTicketProductions({ limit, offset, queryString: queryString as string });
  const showProductions = view === 'productions';
  const { products, productsCount, loading } = showProductions
    ? {
        products: productionList.productions,
        productsCount: productionList.productionsCount,
        loading: productionList.loading,
      }
    : events;

  const setView = (nextView: View) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { skip, ...withoutSkip } = query;
    push({ query: { ...withoutSkip, view: nextView } });
  };
  const viewLabels: Record<View, string> = {
    productions: formatMessage({ id: 'ticketing_view_productions', defaultMessage: 'Productions' }),
    events: formatMessage({ id: 'ticketing_view_events', defaultMessage: 'Single events' }),
    performances: formatMessage({
      id: 'ticketing_view_performances',
      defaultMessage: 'All dates',
    }),
  };

  const periodLabels: Record<EventListPeriod, string> = {
    upcoming: formatMessage({ id: 'events_upcoming', defaultMessage: 'Upcoming' }),
    past: formatMessage({ id: 'events_past', defaultMessage: 'Past' }),
    all: formatMessage({ id: 'events_all', defaultMessage: 'All' }),
  };

  const headerText = showProductions
    ? formatMessage(
        {
          id: 'production_count_header',
          defaultMessage: '{count, plural, one {# Production} other {# Productions}}',
        },
        { count: productsCount },
      )
    : productsCount === 1
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
      <BreadCrumbs depth={3} />
      <PageHeader
        addPath={hasRole('manageProducts') && '/ext/ticketing/new'}
        addButtonText={formatMessage({ id: 'production_add', defaultMessage: 'Add production' })}
        title={formatMessage({ id: 'ticketing', defaultMessage: 'Ticketing' })}
        headerText={headerText}
      />
      <div className="mt-5 inline-block min-w-full overflow-x-auto px-1 pb-5">
        <ListHeader />
        <div className="my-3 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-md shadow-xs" role="group">
            {VIEWS.map((option, index) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => setView(option)}
                className={[
                  'border border-border-default px-4 py-2 text-sm font-medium',
                  index === 0 ? 'rounded-l-md' : '',
                  index === VIEWS.length - 1 ? 'rounded-r-md' : '',
                  view === option
                    ? 'bg-slate-800 text-white'
                    : 'bg-surface text-text-secondary hover:bg-surface-raised',
                ].join(' ')}
              >
                {viewLabels[option]}
              </button>
            ))}
          </div>
        </div>
        <div className="my-3 flex flex-wrap items-center gap-3">
          {!showProductions && (
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
          )}
          <div className="min-w-0 flex-1">
            <SearchField onInputChange={setQueryString} defaultValue={queryString} />
          </div>
        </div>
        {!showProductions && period !== 'all' && (
          <p className="mb-3 text-xs text-text-muted">
            {formatMessage({
              id: 'events_without_date_hint',
              defaultMessage: 'Events without a start date are listed under All.',
            })}
          </p>
        )}
        {loading && !products.length ? (
          <Loading />
        ) : showProductions ? (
          <TicketProductionList productions={products} />
        ) : (
          <TicketEventList products={products} />
        )}
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
