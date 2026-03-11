import { useState } from 'react';
import { useIntl } from 'react-intl';
import Loading from '../../common/components/Loading';
import NoData from '../../common/components/NoData';
import useGateEvents from '../hooks/useGateEvents';
import useGateEventDetail from '../hooks/useGateEventDetail';
import useIsPassCodeValid from '../hooks/useIsPassCodeValid';
import GateEventList from './GateEventList';
import GateAttendeeList from './GateAttendeeList';

const GateControl = ({ onLogout, isAdmin = false }) => {
  const { formatMessage } = useIntl();
  const { clearPassCode } = useIsPassCodeValid();
  const { events, loading: eventsLoading } = useGateEvents({
    onlyInvalidateable: !isAdmin,
  });
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const {
    event: selectedEvent,
    loading: detailLoading,
    refetch,
  } = useGateEventDetail(selectedEventId);

  const selectedEventFromList: any = selectedEventId
    ? events.find((e: any) => e._id === selectedEventId)
    : null;

  const title =
    selectedEventFromList?.texts?.title || (selectedEvent as any)?.texts?.title;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {selectedEventId && (
            <button
              type="button"
              onClick={() => setSelectedEventId(null)}
              className="inline-flex items-center rounded-md border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {formatMessage({ id: 'gate_back', defaultMessage: 'Back' })}
            </button>
          )}
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {selectedEventId
              ? title
              : formatMessage({
                  id: isAdmin ? 'gate_all_events' : 'gate_active_events',
                  defaultMessage: isAdmin ? 'All Events' : 'Active Events',
                })}
          </h2>
        </div>
        {onLogout && (
          <button
            type="button"
            onClick={async () => {
              await clearPassCode();
              onLogout();
            }}
            className="inline-flex items-center rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            {formatMessage({
              id: 'gate_deactivate',
              defaultMessage: 'Deactivate Scanner',
            })}
          </button>
        )}
      </div>

      {selectedEventId ? (
        detailLoading && !selectedEvent ? (
          <Loading />
        ) : selectedEvent ? (
          <GateAttendeeList event={selectedEvent} onRefetch={refetch} />
        ) : (
          <Loading />
        )
      ) : eventsLoading ? (
        <Loading />
      ) : events.length ? (
        <GateEventList
          events={events}
          onSelectEvent={(e) => setSelectedEventId(e._id)}
        />
      ) : (
        <NoData
          message={formatMessage({
            id: 'gate_no_events',
            defaultMessage: 'No events available.',
          })}
        />
      )}
    </div>
  );
};

export default GateControl;
