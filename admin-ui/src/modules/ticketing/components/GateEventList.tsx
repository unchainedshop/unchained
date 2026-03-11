import { useIntl } from 'react-intl';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import Badge from '../../common/components/Badge';

const GateEventList = ({ events, onSelectEvent }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  return (
    <div className="space-y-3">
      {events.map((event: any) => {
        const slot = event?.contractConfiguration?.ercMetadataProperties?.slot;
        const tokens = event?.tokens || [];
        const activeTokens = tokens.filter((t) => !t.isCanceled);
        const redeemedCount = activeTokens.filter(
          (t) => t.invalidatedDate,
        ).length;
        const invalidateableCount = activeTokens.filter(
          (t) => t.isInvalidateable && !t.invalidatedDate,
        ).length;

        return (
          <button
            key={event._id}
            type="button"
            onClick={() => onSelectEvent(event)}
            className="w-full text-left bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {event?.texts?.title}
                </h3>
                {event?.texts?.subtitle && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {event.texts.subtitle}
                  </p>
                )}
                {slot && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {formatDateTime(slot, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                )}
              </div>
              <div className="ml-4 flex items-center gap-3">
                {invalidateableCount > 0 && (
                  <Badge
                    text={`${invalidateableCount} ${formatMessage({ id: 'gate_redeemable', defaultMessage: 'redeemable' })}`}
                    color="emerald"
                    square
                  />
                )}
                <div className="text-right">
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {redeemedCount}
                  </span>
                  <span className="text-slate-400">
                    {' '}
                    / {activeTokens.length}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatMessage({
                      id: 'gate_redeemed',
                      defaultMessage: 'redeemed',
                    })}
                  </p>
                </div>
                <svg
                  className="h-5 w-5 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default GateEventList;
