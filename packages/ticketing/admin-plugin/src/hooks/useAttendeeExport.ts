import { useIntl } from 'react-intl';
import { buildAttendeeCsv, type AttendeeTicket } from '../utils/attendees.ts';
import { downloadCsv, toFileName } from '../utils/download.ts';
import { useAuth } from '@unchainedshop/admin-ui/hooks';

/** Downloads tickets as the attendee CSV (event page and gate), with translated headers. */
const useAttendeeExport = () => {
  const { formatMessage } = useIntl();
  const withContacts = useAuth().hasRole('viewUserContactInfos');
  return (tickets: AttendeeTicket[], name: string) => {
    const csv = buildAttendeeCsv(tickets, {
      ticketId: formatMessage({ id: 'csv_ticket_id', defaultMessage: 'Ticket ID' }),
      serial: formatMessage({ id: 'csv_serial', defaultMessage: 'Ticket #' }),
      attendee: formatMessage({ id: 'csv_attendee', defaultMessage: 'Attendee' }),
      buyer: formatMessage({ id: 'csv_buyer', defaultMessage: 'Buyer' }),
      status: formatMessage({ id: 'csv_status', defaultMessage: 'Status' }),
      redeemedAt: formatMessage({ id: 'csv_redeemed_at', defaultMessage: 'Redeemed at' }),
      cancelledAt: formatMessage({ id: 'csv_cancelled_at', defaultMessage: 'Cancelled at' }),
      guest: formatMessage({ id: 'ticket_guest_buyer', defaultMessage: 'Guest' }),
      ...(withContacts && {
        email: formatMessage({ id: 'csv_email', defaultMessage: 'E-mail' }),
        phone: formatMessage({ id: 'csv_phone', defaultMessage: 'Phone' }),
      }),
    });
    downloadCsv(`${toFileName(name)}-attendees.csv`, csv);
  };
};

export default useAttendeeExport;
