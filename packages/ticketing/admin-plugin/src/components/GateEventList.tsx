import { Fragment } from 'react';
import { useIntl } from 'react-intl';
import { Badge } from '@unchainedshop/admin-ui/ui';
import { findSamePerformance } from '../utils/gate-events.ts';
import { useFormatDateTime } from '../utils/misc.ts';

/**
 * The events a gate can pick, soonest first; ticket details load once the gate opens. A tap
 * opens the gate for one event. A performance sold as several products (one per ticket category
 * or seating area) gets a shortcut that opens one gate for all of them, and any events can be
 * ticked to open one gate for them together.
 */
const GateEventList = ({
  events,
  selectedIds,
  onSelectionChange,
  onOpen,
}: {
  events: any[];
  selectedIds: string[];
  onSelectionChange: (eventIds: string[]) => void;
  onOpen: (eventIds: string[]) => void;
}) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  const toggle = (eventId: string) =>
    onSelectionChange(
      selectedIds.includes(eventId)
        ? selectedIds.filter((id) => id !== eventId)
        : [...selectedIds, eventId],
    );

  return (
    <div className="space-y-3">
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-default bg-surface p-4 shadow-sm">
          <span className="text-sm font-medium text-text-primary">
            {formatMessage(
              {
                id: 'gate_events_selected',
                defaultMessage: '{count, plural, one {# event} other {# events}} selected',
              },
              { count: selectedIds.length },
            )}
          </span>
          <div className="flex flex-wrap gap-2">
            {selectedIds.length < events.length && (
              <button
                type="button"
                onClick={() => onSelectionChange(events.map(({ _id }) => _id))}
                className="inline-flex items-center rounded-md border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-raised"
              >
                {formatMessage({ id: 'gate_select_all', defaultMessage: 'Select all' })}
              </button>
            )}
            <button
              type="button"
              onClick={() => onSelectionChange([])}
              className="inline-flex items-center rounded-md border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-raised"
            >
              {formatMessage({ id: 'gate_clear_selection', defaultMessage: 'Clear' })}
            </button>
            <button
              type="button"
              onClick={() => onOpen(selectedIds)}
              className="inline-flex items-center rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-900"
            >
              {formatMessage({
                id: 'gate_open_selected',
                defaultMessage: 'Admit them at one gate',
              })}
            </button>
          </div>
        </div>
      )}
      {events.map((event: any) => {
        const performance = findSamePerformance(events, event);
        const opensPerformance = performance.length > 1 && performance[0]._id === event._id;
        return (
          <Fragment key={event._id}>
            {opensPerformance && (
              <button
                type="button"
                onClick={() => onOpen(performance.map(({ _id }) => _id))}
                className="w-full rounded-lg border border-dashed border-border-default px-5 py-3 text-left text-sm font-medium text-text-secondary hover:bg-surface-raised"
              >
                {formatMessage(
                  {
                    id: 'gate_open_performance',
                    defaultMessage: 'Admit all {count} categories of {title} at one gate',
                  },
                  { count: performance.length, title: event?.texts?.title || '' },
                )}
              </button>
            )}
            <div className="flex items-stretch bg-surface rounded-lg shadow-sm border border-border-subtle hover:border-border-default transition-colors">
              <label className="flex items-center border-r border-border-subtle px-4">
                <input
                  type="checkbox"
                  className="rounded border-border-default"
                  checked={selectedIds.includes(event._id)}
                  onChange={() => toggle(event._id)}
                  aria-label={formatMessage(
                    {
                      id: 'gate_select_event',
                      defaultMessage: 'Admit {title} together with other events',
                    },
                    { title: event?.texts?.title || event._id },
                  )}
                />
              </label>
              <button
                type="button"
                onClick={() => onOpen([event._id])}
                className="min-w-0 flex-1 text-left p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-text-primary truncate">
                      {event?.texts?.title}
                    </h3>
                    {event?.texts?.subtitle && (
                      <p className="text-sm text-text-muted truncate">{event.texts.subtitle}</p>
                    )}
                    <p className="text-sm text-text-muted mt-1">
                      {event.event?.startsAt
                        ? formatDateTime(event.event?.startsAt, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : formatMessage({ id: 'gate_no_start', defaultMessage: 'No start date' })}
                      {event.event?.location && ` · ${event.event?.location}`}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    {event.event?.category && (
                      <Badge text={event.event?.category} color="slate" square />
                    )}
                    {event.event?.isCanceled && (
                      <Badge
                        text={formatMessage({ id: 'gate_event_cancelled', defaultMessage: 'Cancelled' })}
                        color="rose"
                        square
                      />
                    )}
                    <div className="text-right">
                      <span className="text-xl font-bold text-text-primary">
                        {event.tokensCount ?? 0}
                      </span>
                      <p className="text-xs text-text-muted">
                        {formatMessage({ id: 'gate_tickets', defaultMessage: 'tickets' })}
                      </p>
                    </div>
                    <svg
                      className="h-5 w-5 text-text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
};

export default GateEventList;
