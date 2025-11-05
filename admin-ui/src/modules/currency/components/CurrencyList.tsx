import { useIntl } from 'react-intl';

import useAuth from '../../Auth/useAuth';
import Table from '../../common/components/Table';
import CurrencyListItem from './CurrencyListItem';

const CurrencyList = ({ currencies, onRemoveCurrency, sortable }) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  return (
    <Table className="min-w-full ">
      {currencies?.map((currency) => (
        <Table.Row key={currency._id} header enablesort={sortable}>
          <Table.Cell sortKey="isoCode">
            {formatMessage({
              id: 'iso_code',
              defaultMessage: 'ISO code',
            })}
          </Table.Cell>

          <Table.Cell>
            {formatMessage({ id: 'name', defaultMessage: 'Name' })}
          </Table.Cell>

          <Table.Cell sortKey="isActive">
            {formatMessage({ id: 'status', defaultMessage: 'Status' })}
          </Table.Cell>
          <Table.Cell>&nbsp;</Table.Cell>
        </Table.Row>
      ))}

      {currencies?.map((currency) => (
        <CurrencyListItem
          key={`${currency?._id}-body`}
          currency={currency}
          onRemove={onRemoveCurrency}
          enableDelete={hasRole('manageCurrencies')}
          enableEdit={true}
        />
      ))}
    </Table>
  );
};

export default CurrencyList;
