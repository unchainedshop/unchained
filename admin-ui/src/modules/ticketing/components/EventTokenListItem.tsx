import Link from 'next/link';
import { useIntl } from 'react-intl';
import Table from '../../common/components/Table';
import Badge from '../../common/components/Badge';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import formatUsername from '../../common/utils/formatUsername';
import MediaAvatar from '../../common/components/MediaAvatar';

const EventTokenListItem = ({ token, onCancelTicket, onInvalidateTicket }) => {
  const { formatMessage } = useIntl();
  const { formatDateTime } = useFormatDateTime();

  return (
    <Table.Row key={token._id}>
      <Table.Cell>
        <Link
          href={`/tokens?tokenId=${token._id}`}
          className="font-medium text-slate-800 dark:text-slate-200 hover:underline"
        >
          {token.tokenSerialNumber || token._id?.slice(-8)}
        </Link>
      </Table.Cell>
      <Table.Cell>
        {token.user && (
          <Link
            href={`/users?userId=${token.user._id}`}
            className="flex items-center text-sm text-slate-800 dark:text-slate-200 hover:underline"
          >
            <MediaAvatar file={token.user?.avatar} className="mr-2" />
            <span>{formatUsername(token.user)}</span>
          </Link>
        )}
      </Table.Cell>
      <Table.Cell>
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {token.user?.lastContact?.emailAddress ||
            token.user?.primaryEmail?.address ||
            '-'}
        </span>
      </Table.Cell>
      <Table.Cell>
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {token.user?.lastContact?.telNumber || '-'}
        </span>
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
          <span className="text-sm text-slate-400">-</span>
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
                  className="inline-flex items-center rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
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
                  className="inline-flex items-center rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
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
