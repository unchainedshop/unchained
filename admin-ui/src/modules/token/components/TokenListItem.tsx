import Link from 'next/link';
import Table from '../../common/components/Table';
import useFormatDateTime from '../../common/utils/useFormatDateTime';
import formatUsername from '../../common/utils/formatUsername';
import MediaAvatar from '../../common/components/MediaAvatar';
import Badge from '../../common/components/Badge';
import { TOKEN_STATUSES } from '../../common/data/miscellaneous';

const TokenListItem = ({ token }) => {
  const { formatDateTime } = useFormatDateTime();

  return (
    <Table.Row key={token._id}>
      <Table.Cell>
        <div className="flex items-center text-sm">
          <Link
            href={`/tokens?tokenId=${token._id}`}
            className="font-medium text-slate-800 dark:text-slate-700"
          >
            {token?._id}
          </Link>
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex items-center text-sm">
          {token.product?.texts?.title || 'N/A'}
        </div>
      </Table.Cell>
      <Table.Cell>
        <Link
          href={`/users?userId=${token.user._id}`}
          className="flex items-center text-sm text-slate-800 dark:text-slate-700 hover:text-decoration"
        >
          <MediaAvatar file={token.user?.avatar} className="mr-3" />

          <span className="font-medium ml-2">{formatUsername(token.user)}</span>
        </Link>
      </Table.Cell>
      <Table.Cell>
        <Badge
          text={token?.status === 'CENTRALIZED' ? 'Off-Chain 🏛' : 'On-Chain ⛓'}
          color={TOKEN_STATUSES[token.status]}
          square
        />
      </Table.Cell>
      <Table.Cell>
        <div className="flex items-center text-sm">
          <Link
            href={`/orders?orderId=${token.ercMetadata?.orderId}`}
            className="font-medium text-slate-800 dark:text-slate-700"
          >
            {token?.ercMetadata?.orderId}
          </Link>
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex items-center text-sm">
          {token.quantity || 'N/A'}
        </div>
      </Table.Cell>

      <Table.Cell>
        <div className="flex items-center text-sm">
          {token.invalidatedDate
            ? formatDateTime(token.invalidatedDate, {
                dateStyle: 'short',
                timeStyle: 'short',
              })
            : null}
        </div>
      </Table.Cell>
    </Table.Row>
  );
};

export default TokenListItem;
