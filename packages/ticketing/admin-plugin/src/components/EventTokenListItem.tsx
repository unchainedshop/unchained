import Link from 'next/link';
import { useIntl } from 'react-intl';
import { Table, Badge, MediaAvatar } from '@unchainedshop/admin-ui/ui';
import { useFormatDateTime, formatUsername } from '../utils/misc';

const EventTokenListItem = ({ token, onCancelTicket, onInvalidateTicket }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  return (
    <Table.Row key={token._id}>
      <Table.Cell>
        <Link
          href={`/ext/tokens/${token._id}`}
          className="font-medium text-text-primary hover:underline"
        >
          {token.tokenSerialNumber || token._id?.slice(-8)}
        </Link>
      </Table.Cell>
      <Table.Cell>
        {token.user && (
          <Link
            href={`/users?userId=${token.user._id}`}
            className="flex items-center text-sm text-text-primary hover:underline"
          >
            <MediaAvatar file={token.user?.avatar} className="mr-2" />
            <span>{formatUsername(token.user)}</span>
          </Link>
        )}
      </Table.Cell>
      <Table.Cell>
        <span className="text-sm text-text-secondary">
          {token.user?.lastContact?.emailAddress || token.user?.primaryEmail?.address || '-'}
        </span>
      </Table.Cell>
      <Table.Cell>
        <span className="text-sm text-text-secondary">{token.user?.lastContact?.telNumber || '-'}</span>
      </Table.Cell>
      <Table.Cell>
        {token.invalidatedDate ? (
          <Badge
            text={formatDateTime(token.invalidatedDate, {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
            color="emerald"
            square
          />
        ) : (
          <span className="text-sm text-text-muted">-</span>
        )}
      </Table.Cell>
      <Table.Cell>
        <div className="flex items-center gap-2">
          {token.isCanceled ? (
            <Badge
              text={formatMessage({
                id: 'cancelled',
                defaultMessage: 'Cancelled',
              })}
              color="rose"
              square
            />
          ) : (
            <>
              {!token.invalidatedDate && (
                <button
                  type="button"
                  onClick={() => onCancelTicket(token._id)}
                  className="inline-flex items-center rounded-md border border-border-default px-3 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                >
                  {formatMessage({
                    id: 'cancel_ticket',
                    defaultMessage: 'Cancel',
                  })}
                </button>
              )}
              {token.isInvalidateable && !token.invalidatedDate && (
                <button
                  type="button"
                  onClick={() => onInvalidateTicket(token._id)}
                  className="inline-flex items-center rounded-md border border-border-default px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                >
                  {formatMessage({
                    id: 'redeem_ticket',
                    defaultMessage: 'Redeem',
                  })}
                </button>
              )}
            </>
          )}
        </div>
      </Table.Cell>
    </Table.Row>
  );
};

export default EventTokenListItem;
