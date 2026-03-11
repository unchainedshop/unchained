import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import Table from '../../common/components/Table';
import Badge from '../../common/components/Badge';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import formatUsername from '../../common/utils/formatUsername';
import useInvalidateTicket from '../../token/hooks/useInvalidateTicket';

const GateAttendeeList = ({ event }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();
  const { invalidateTicket } = useInvalidateTicket();

  const slot = event?.contractConfiguration?.ercMetadataProperties?.slot;
  const tokens = event?.tokens || [];
  const activeTokens = tokens.filter((t) => !t.isCanceled);
  const redeemedCount = activeTokens.filter((t) => t.invalidatedDate).length;

  const onRedeem = useCallback(async (tokenId: string) => {
    try {
      await invalidateTicket({ tokenId });
      toast.success(
        formatMessage({
          id: 'gate_ticket_redeemed',
          defaultMessage: 'Ticket redeemed successfully',
        }),
      );
    } catch (e) {
      toast.error(
        formatMessage({
          id: 'gate_redeem_error',
          defaultMessage:
            'Could not redeem ticket. It may already be redeemed or not yet redeemable.',
        }),
      );
    }
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {event?.texts?.title}
          </h3>
          {slot && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {formatDateTime(slot, {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </p>
          )}
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {redeemedCount}
          </span>
          <span className="text-slate-400"> / {activeTokens.length}</span>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatMessage({
              id: 'gate_redeemed',
              defaultMessage: 'redeemed',
            })}
          </p>
        </div>
      </div>

      {!activeTokens.length ? (
        <p className="py-4 text-sm text-slate-500 dark:text-slate-400">
          {formatMessage({
            id: 'gate_no_tickets',
            defaultMessage: 'No tickets for this event.',
          })}
        </p>
      ) : (
        <Table className="min-w-full">
          <Table.Row header>
            <Table.Cell>
              {formatMessage({
                id: 'ticket_number',
                defaultMessage: 'Ticket #',
              })}
            </Table.Cell>
            <Table.Cell>
              {formatMessage({
                id: 'attendee',
                defaultMessage: 'Attendee',
              })}
            </Table.Cell>
            <Table.Cell>
              {formatMessage({
                id: 'email',
                defaultMessage: 'E-Mail',
              })}
            </Table.Cell>
            <Table.Cell>
              {formatMessage({
                id: 'status',
                defaultMessage: 'Status',
              })}
            </Table.Cell>
            <Table.Cell>
              {formatMessage({
                id: 'actions',
                defaultMessage: 'Actions',
              })}
            </Table.Cell>
          </Table.Row>
          {activeTokens.map((token) => (
            <Table.Row key={token._id}>
              <Table.Cell>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {token.tokenSerialNumber || token._id?.slice(-8)}
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="text-sm text-slate-800 dark:text-slate-200">
                  {token.user ? formatUsername(token.user) : '-'}
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {token.user?.lastContact?.emailAddress ||
                    token.user?.primaryEmail?.address ||
                    '-'}
                </span>
              </Table.Cell>
              <Table.Cell>
                {token.invalidatedDate ? (
                  <Badge
                    text={formatDateTime(token.invalidatedDate, {
                      timeStyle: 'short',
                    })}
                    color="emerald"
                    square
                  />
                ) : (
                  <Badge
                    text={formatMessage({
                      id: 'gate_pending',
                      defaultMessage: 'Pending',
                    })}
                    color="amber"
                    square
                  />
                )}
              </Table.Cell>
              <Table.Cell>
                {!token.invalidatedDate && token.isInvalidateable && (
                  <button
                    type="button"
                    onClick={() => onRedeem(token._id)}
                    className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  >
                    {formatMessage({
                      id: 'gate_redeem',
                      defaultMessage: 'Redeem',
                    })}
                  </button>
                )}
                {token.invalidatedDate && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {formatMessage({
                      id: 'gate_checked_in',
                      defaultMessage: 'Checked in',
                    })}
                  </span>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table>
      )}
    </div>
  );
};

export default GateAttendeeList;
