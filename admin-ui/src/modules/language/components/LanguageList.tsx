import { useIntl } from 'react-intl';
import useAuth from '../../Auth/useAuth';
import Table from '../../common/components/Table';
import LanguageListItem from './LanguageListItem';

const LanguageList = ({ languages, onRemoveLanguage, sortable }) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();

  return (
    <Table className="min-w-full ">
      {languages?.map((language) => (
        <Table.Row key={language._id} header enablesort={sortable}>
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
          <Table.Cell>
            <span className="sr-only">
              {formatMessage({ id: 'edit', defaultMessage: 'Edit' })}
              {formatMessage({ id: 'delete', defaultMessage: 'Delete' })}
            </span>
          </Table.Cell>
        </Table.Row>
      ))}

      {languages?.map((language) => (
        <LanguageListItem
          key={`${language?._id}`}
          language={language}
          onRemove={onRemoveLanguage}
          enableEdit={true}
          enableDelete={hasRole('removeCountry')}
        />
      ))}
    </Table>
  );
};

export default LanguageList;
