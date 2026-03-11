import { useIntl } from 'react-intl';
import Loading from '../../common/components/Loading';
import NoData from '../../common/components/NoData';
import useGateEvents from '../hooks/useGateEvents';
import GateAttendeeList from './GateAttendeeList';

const GateControl = ({ onLogout }) => {
  const { formatMessage } = useIntl();
  const { todayEvents, loading } = useGateEvents();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {formatMessage({
            id: 'gate_todays_events',
            defaultMessage: "Today's Events",
          })}
        </h2>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          {formatMessage({
            id: 'gate_deactivate',
            defaultMessage: 'Deactivate Scanner',
          })}
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : todayEvents.length ? (
        todayEvents.map((event) => (
          <GateAttendeeList key={event._id} event={event} />
        ))
      ) : (
        <NoData
          message={formatMessage({
            id: 'gate_no_events_today',
            defaultMessage: 'No events scheduled for today.',
          })}
        />
      )}
    </div>
  );
};

export default GateControl;
