import { useIntl } from 'react-intl';
import Table from '../../common/components/Table';
import QuotationListItem from './QuotationListItem';

const QuotationList = ({ quotations, sortable = false, showUser = false }) => {
  const { formatMessage } = useIntl();

  return (
    <Table className="min-w-full">
      {quotations?.map((quotation) => (
        <Table.Row key={quotation._id} header enablesort={sortable}>
          <Table.Cell sortKey="quotationNumber">
            {formatMessage({
              id: 'quotation_number',
              defaultMessage: 'Quotation number',
            })}
          </Table.Cell>

          <Table.Cell sortKey="created">
            {formatMessage({
              id: 'created',
              defaultMessage: 'Created',
            })}
          </Table.Cell>

          <Table.Cell sortKey="expires">
            {formatMessage({
              id: 'expires',
              defaultMessage: 'Expires',
            })}
          </Table.Cell>
          {showUser && (
            <Table.Cell>
              {formatMessage({
                id: 'user',
                defaultMessage: 'User',
              })}
            </Table.Cell>
          )}

          <Table.Cell>
            {formatMessage({
              id: 'product',
              defaultMessage: 'Product',
            })}
          </Table.Cell>

          <Table.Cell sortKey="status">
            {formatMessage({
              id: 'status',
              defaultMessage: 'Status',
            })}
          </Table.Cell>
        </Table.Row>
      ))}

      {quotations?.map((quotation) => (
        <QuotationListItem
          showUser={showUser}
          key={`${quotation?._id}-body`}
          quotation={quotation}
        />
      ))}
    </Table>
  );
};

export default QuotationList;
