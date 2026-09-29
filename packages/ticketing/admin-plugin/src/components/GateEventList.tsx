import { useIntl } from 'react-intl';
import { Badge } from '@unchainedshop/admin-ui/ui';
import { useFormatDateTime } from '../utils/misc';

const GateEventList = ({ events, onSelectEvent }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  return (
    <div className="space-y-3">
      {events.map((event: any) => {
        const slot = event?.contractConfiguration?.ercMetadataProperties?.slot;
        const tokens = event?.tokens || [];
        const activeTokens = tokens.filter((t) => !t.isCanceled);
        const redeemedCount = activeTokens.filter((t) => t.invalidatedDate).length;
        const invalidateableCount = activeTokens.filter(
          (t) => t.isInvalidateable && !t.invalidatedDate,
        ).length;

        return (
          <button
            key={event._id}
            type="button"
            onClick={() => onSelectEvent(event)}
            className="w-full text-left bg-surface rounded-lg shadow-sm border border-border-subtle p-5 hover:border-border-default transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-text-primary truncate">
                  {event?.texts?.title}
                </h3>
                {event?.texts?.subtitle && (
                  <p className="text-sm text-text-muted truncate">{event.texts.subtitle}</p>
                )}
                {slot && (
                  <p className="text-sm text-text-muted mt-1">
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
                  <span className="text-xl font-bold text-text-primary">{redeemedCount}</span>
                  <span className="text-text-muted"> / {activeTokens.length}</span>
                  <p className="text-xs text-text-muted">
                    {formatMessage({
                      id: 'gate_redeemed',
                      defaultMessage: 'redeemed',
                    })}
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
        );
      })}
    </div>
  );
};

export default GateEventList;
