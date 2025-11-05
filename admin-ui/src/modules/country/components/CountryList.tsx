import { useIntl } from 'react-intl';
import useAuth from '../../Auth/useAuth';
import Table from '../../common/components/Table';
import CountryListItem from './CountryListItem';

const CountryList = ({ countries, onRemoveCountry, sortable }) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();

  return (
    <Table className="min-w-full">
      {countries?.map((country) => (
        <Table.Row key={country._id} header enablesort={sortable}>
          <Table.Cell sortKey="isoCode">
            {formatMessage({
              id: 'iso_code',
              defaultMessage: 'ISO code',
            })}
          </Table.Cell>

          <Table.Cell>
            {formatMessage({ id: 'name', defaultMessage: 'Name' })}
          </Table.Cell>

          <Table.Cell>
            {formatMessage({
              id: 'default_currency',
              defaultMessage: 'Default currency',
            })}
          </Table.Cell>

          <Table.Cell sortKey="isActive">
            {formatMessage({ id: 'status', defaultMessage: 'Status' })}
          </Table.Cell>
          <Table.Cell>
            <span className="sr-only">
              {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
              {formatMessage({ id: 'delete', defaultMessage: 'Delete' })}
            </span>
          </Table.Cell>
        </Table.Row>
      ))}

      {countries?.map((country) => (
        <CountryListItem
          key={`${country?._id}-body`}
          country={country}
          onRemove={onRemoveCountry}
          enableEdit={true}
          enableDelete={hasRole('manageCountries')}
        />
      ))}
    </Table>
  );
};

export default CountryList;
