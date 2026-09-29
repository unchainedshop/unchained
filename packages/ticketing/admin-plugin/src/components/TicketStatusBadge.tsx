import { useIntl } from 'react-intl';
import { Badge } from '@unchainedshop/admin-ui/ui';
import { useFormatDateTime } from '../utils/misc.ts';

const STATUS_COLORS = {
  VALID: 'sky',
  REDEEMED: 'emerald',
  CANCELLED: 'rose',
};

/**
 * Token.ticketStatus with the date that goes with it: when a ticket was redeemed or cancelled.
 * A cancelled ticket also carries an invalidatedDate, so the redeemed date is only shown for
 * REDEEMED.
 */
const TicketStatusBadge = ({ token, dateStyle = 'short' as 'short' | 'time' }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const format = (date: string) =>
    formatDateTime(
      date,
      dateStyle === 'time' ? { timeStyle: 'short' } : { dateStyle: 'short', timeStyle: 'short' },
    );

  const status = token?.ticketStatus || 'VALID';
  const labels = {
    VALID: formatMessage({ id: 'ticket_status_valid', defaultMessage: 'Valid' }),
    REDEEMED: token?.invalidatedDate
      ? formatMessage(
          { id: 'ticket_status_redeemed_at', defaultMessage: 'Redeemed {date}' },
          { date: format(token.invalidatedDate) },
        )
      : formatMessage({ id: 'ticket_status_redeemed', defaultMessage: 'Redeemed' }),
    CANCELLED: token?.cancelledDate
      ? formatMessage(
          { id: 'ticket_status_cancelled_at', defaultMessage: 'Cancelled {date}' },
          { date: format(token.cancelledDate) },
        )
      : formatMessage({ id: 'ticket_status_cancelled', defaultMessage: 'Cancelled' }),
  };

  return <Badge text={labels[status] || status} color={STATUS_COLORS[status] || 'slate'} square />;
};

export default TicketStatusBadge;
