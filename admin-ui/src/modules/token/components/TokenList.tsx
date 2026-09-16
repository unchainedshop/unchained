import { useIntl } from 'react-intl';
import Table from '../../common/components/Table';
import TokenListItem from './TokenListItem';

const TokenList = ({ tokens }) => {
  const { formatMessage } = useIntl();

  return (
    <>
      <Table className="min-w-full">
        <Table.Row header>
          <Table.Cell>
            {formatMessage({ id: 'id', defaultMessage: 'ID' })}
          </Table.Cell>
          <Table.Cell>
            {formatMessage({ id: 'name', defaultMessage: 'Name' })}
          </Table.Cell>
          <Table.Cell>
            {formatMessage({ id: 'user', defaultMessage: 'User' })}
          </Table.Cell>
          <Table.Cell>
            {formatMessage({ id: 'status', defaultMessage: 'Status' })}
          </Table.Cell>
          <Table.Cell>
            {formatMessage({ id: 'order_id', defaultMessage: 'Order' })}
          </Table.Cell>
          <Table.Cell>
            {formatMessage({ id: 'quantity', defaultMessage: 'Quantity' })}
          </Table.Cell>
          <Table.Cell>
            {formatMessage({
              id: 'token_invalidation_date',
              defaultMessage: 'Invalidated',
            })}
          </Table.Cell>
        </Table.Row>
        {(tokens || []).map((token) => (
          <TokenListItem token={token} key={token?._id} />
        ))}
      </Table>
    </>
  );
};

export default TokenList;
