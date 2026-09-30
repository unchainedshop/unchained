import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import { DangerMessage } from '@unchainedshop/admin-ui/modal';
import { useModal } from '@unchainedshop/admin-ui/hooks';
import useCancelTicket from './useCancelTicket.ts';

/**
 * Asks before cancelling a ticket (optionally with a discount code for the buyer), then cancels
 * it. Needs the cancelTicket action; used by the event page and the gate.
 */
const useCancelTicketDialog = () => {
  const { formatMessage } = useIntl();
  const { setModal } = useModal();
  const { cancelTicket } = useCancelTicket();

  return (tokenId: string) => {
    let generateDiscount = false;
    return setModal(
      <DangerMessage
        onCancelClick={() => setModal('')}
        message={
          <>
            {formatMessage({
              id: 'cancel_ticket_confirmation',
              defaultMessage: 'Are you sure you want to cancel this ticket?',
            })}
            <label className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                className="rounded border-border-default"
                onChange={(e) => {
                  generateDiscount = e.target.checked;
                }}
              />
              {formatMessage({
                id: 'generate_discount_code',
                defaultMessage: 'Generate discount code for the user',
              })}
            </label>
          </>
        }
        onOkClick={async () => {
          setModal('');
          try {
            await cancelTicket({ tokenId, generateDiscount });
            toast.success(
              formatMessage({ id: 'ticket_cancelled', defaultMessage: 'Ticket cancelled successfully' }),
            );
          } catch (e) {
            toast.error(e.message);
          }
        }}
        okText={formatMessage({ id: 'cancel_ticket', defaultMessage: 'Cancel Ticket' })}
      />,
    );
  };
};

export default useCancelTicketDialog;
