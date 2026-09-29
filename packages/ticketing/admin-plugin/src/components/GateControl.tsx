import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import { Loading } from '@unchainedshop/admin-ui/ui';
import useGateEvents from '../hooks/useGateEvents.ts';
import useGateEventDetails from '../hooks/useGateEventDetails.ts';
import { getGateSlotRange } from '../utils/dates.ts';
import { formatGateEventIds, parseGateEventIds, summarizeGateEvents } from '../utils/gate-events.ts';
import { useFormatDateTime } from '../utils/misc.ts';
import GateEventList from './GateEventList.tsx';
import GateStation from './GateStation.tsx';

const Notice = ({ children }) => (
  <p className="rounded-lg border border-dashed border-border-default p-6 text-center text-sm text-text-muted">
    {children}
  </p>
);

const canUseFullscreen = () => typeof document !== 'undefined' && Boolean(document.fullscreenEnabled);

const eventLabel = (event) =>
  [event.texts?.title, event.eventCategory].filter(Boolean).join(' · ') || event._id;

/**
 * Gate Control: pick today's events a gate admits (one, all products of one performance, or any
 * ticked ones), then scan and redeem their tickets. The gate's events are kept in the URL
 * (?event=a,b) so a gate device survives a reload.
 */
const GateControl = () => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const { query, push } = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const gateEventIds = parseGateEventIds(query.event);
  const hasGate = gateEventIds.length > 0;
  const openGate = (eventIds: string[]) => {
    const nextQuery = { ...query };
    if (eventIds.length) nextQuery.event = formatGateEventIds(eventIds);
    else delete nextQuery.event;
    setSelectedIds([]);
    push({ query: nextQuery });
  };

  const { events, loading: eventsLoading } = useGateEvents({
    onlyInvalidateable: onlyOpen,
    ...getGateSlotRange(new Date()),
    skip: hasGate,
  });
  const { events: gateEvents, loading: detailLoading } = useGateEventDetails(gateEventIds);
  const summary = summarizeGateEvents(gateEvents);
  const cancelledEvents = gateEvents.filter((event) => event.isCanceled);
  const missingEvents = gateEventIds.length - gateEvents.length;

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    else containerRef.current?.requestFullscreen().catch(() => undefined);
  };

  return (
    <div
      ref={containerRef}
      className="bg-surface-subtle"
      // Full screen turns a phone or tablet into a gate kiosk without the admin navigation.
      style={isFullscreen ? { overflowY: 'auto', padding: '1.5rem' } : undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          {hasGate && (
            <button
              type="button"
              onClick={() => openGate([])}
              className="inline-flex items-center rounded-md border border-border-default px-2 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-raised"
            >
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {formatMessage({ id: 'gate_back', defaultMessage: 'Back' })}
            </button>
          )}
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-text-primary truncate">
              {hasGate
                ? summary.titles.join(' / ')
                : formatMessage({ id: 'gate_todays_events', defaultMessage: "Today's events" })}
            </h2>
            {hasGate && gateEvents.length > 0 && (
              <p className="text-sm text-text-muted">
                {[
                  ...summary.startsAt.map((date) =>
                    formatDateTime(date, { dateStyle: 'full', timeStyle: 'short' }),
                  ),
                  ...summary.locations,
                  ...summary.categories,
                ].join(' · ')}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!hasGate && (
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                className="rounded border-border-default"
                checked={onlyOpen}
                onChange={(e) => setOnlyOpen(e.target.checked)}
              />
              {formatMessage({ id: 'gate_only_open', defaultMessage: 'Only events open for entry' })}
            </label>
          )}
          {canUseFullscreen() && (
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center rounded-md border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-raised"
            >
              {isFullscreen
                ? formatMessage({ id: 'gate_exit_fullscreen', defaultMessage: 'Exit full screen' })
                : formatMessage({ id: 'gate_fullscreen', defaultMessage: 'Full screen' })}
            </button>
          )}
        </div>
      </div>

      {hasGate ? (
        gateEvents.length ? (
          <>
            {cancelledEvents.length > 0 && (
              <p role="alert" className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-800">
                {gateEvents.length === 1
                  ? formatMessage({
                      id: 'gate_selected_event_cancelled',
                      defaultMessage: 'This event has been cancelled, its tickets admit nobody.',
                    })
                  : formatMessage(
                      {
                        id: 'gate_selected_events_cancelled',
                        defaultMessage: 'Cancelled, their tickets admit nobody: {events}',
                      },
                      { events: cancelledEvents.map(eventLabel).join(', ') },
                    )}
              </p>
            )}
            {missingEvents > 0 && !detailLoading && (
              <p role="alert" className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                {formatMessage(
                  {
                    id: 'gate_events_missing',
                    defaultMessage:
                      '{count, plural, one {# event} other {# events}} of this gate could not be loaded, their tickets are refused.',
                  },
                  { count: missingEvents },
                )}
              </p>
            )}
            <GateStation
              key={formatGateEventIds(gateEvents.map(({ _id }) => _id))}
              events={gateEvents}
            />
          </>
        ) : detailLoading ? (
          <Loading />
        ) : (
          <Notice>
            {formatMessage(
              {
                id: 'gate_event_not_found',
                defaultMessage:
                  '{count, plural, one {This event} other {These events}} could not be loaded. Go back and pick another one.',
              },
              { count: gateEventIds.length },
            )}
          </Notice>
        )
      ) : eventsLoading && !events.length ? (
        <Loading />
      ) : events.length ? (
        <GateEventList
          events={events}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onOpen={openGate}
        />
      ) : (
        <Notice>
          {onlyOpen
            ? formatMessage({
                id: 'gate_no_open_events',
                defaultMessage: 'No event of today is open for entry right now.',
              })
            : formatMessage({ id: 'gate_no_events_today', defaultMessage: 'No events today.' })}
        </Notice>
      )}
    </div>
  );
};

export default GateControl;
