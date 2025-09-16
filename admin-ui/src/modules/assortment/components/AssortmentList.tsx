import { useIntl } from 'react-intl';
import Table from '../../common/components/Table';
import AssortmentListItem from './AssortmentListItem';

const AssortmentList = ({ assortments, showAvatar = true, sortable }) => {
  const { formatMessage } = useIntl();
  return (
    <Table className="min-w-full">
      {assortments?.map((assortment) => (
        <Table.Row key={assortment._id} header enablesort={sortable}>
          <Table.Cell>
            {formatMessage({
              id: 'name',
              defaultMessage: 'Name',
            })}
          </Table.Cell>

          <Table.Cell sortKey="isActive">
            {formatMessage({
              id: 'active',
              defaultMessage: 'Active',
            })}
          </Table.Cell>

          <Table.Cell sortKey="isRoot">
            {formatMessage({
              id: 'root',
              defaultMessage: 'Root',
            })}
          </Table.Cell>

          <Table.Cell sortKey="isBase">
            {formatMessage({
              id: 'base',
              defaultMessage: 'Base',
            })}
          </Table.Cell>
          <Table.Cell sortKey="sequence" defaultSortDirection="ASC">
            {formatMessage({
              id: 'sequence',
              defaultMessage: 'Display Order',
            })}
          </Table.Cell>
          <Table.Cell>&nbsp;</Table.Cell>
        </Table.Row>
      ))}
      {assortments?.map((assortment) => (
        <AssortmentListItem
          showAvatar={showAvatar}
          key={`${assortment?._id}-body`}
          assortment={assortment}
        />
      ))}
    </Table>
  );
};

export default AssortmentList;
