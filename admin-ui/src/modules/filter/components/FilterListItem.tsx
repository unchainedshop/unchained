import Link from 'next/link';
import { IRoleAction } from '../../../gql/types';

import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import useAuth from '../../Auth/useAuth';
import Badge from '../../common/components/Badge';
import Table from '../../common/components/Table';
import TableActionsMenu from '../../common/components/TableActionsMenu';

const FILTER_TYPES = {
  SWITCH: 'sky',
  SINGLE_CHOICE: 'lime',
  MULTI_CHOICE: 'cyan',
};
const FilterListItem = ({ filter, onRemove }) => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const router = useRouter();
  const STATUS = {
    true: formatMessage({ id: 'active', defaultMessage: 'Active' }),
    false: formatMessage({ id: 'in_active', defaultMessage: 'In-Active' }),
  };

  const handleEdit = () => {
    router.push(`/filters?filterId=${filter._id}`);
  };

  const handleDelete = async () => {
    await onRemove(filter?._id);
  };
  return (
    <Table.Row className="group">
      <Table.Cell>
        <Link
          href={`/filters?filterId=${filter._id}`}
          className="flex items-center text-sm text-slate-900 dark:text-slate-300 group-hover:text-slate-700 dark:group-hover:text-slate-100"
        >
          {filter?.key &&
            (filter?.key || (
              <>
                {filter._id}{' '}
                <Badge
                  color="blue"
                  text={formatMessage({
                    id: 'name',
                    defaultMessage: 'Name',
                  })}
                />
              </>
            ))}
        </Link>
      </Table.Cell>

      <Table.Cell>
        <Link href={`/filters?filterId=${filter._id}`} className="block">
          <Badge
            text={filter.type?.split('_')?.join(' ')}
            color={FILTER_TYPES[filter.type]}
            square
          />
        </Link>
      </Table.Cell>

      <Table.Cell>
        <Link href={`/filters?filterId=${filter._id}`} className="block">
          <Badge
            text={STATUS[filter.isActive]}
            color={filter.isActive ? 'emerald' : 'amber'}
            square
          />
        </Link>
      </Table.Cell>

      <Table.Cell>
        <Link href={`/filters?filterId=${filter._id}`} className="block">
          {filter.options?.length}
        </Link>
      </Table.Cell>
      <Table.Cell className="text-right">
        <TableActionsMenu
          onEdit={handleEdit}
          onDelete={handleDelete}
          showEdit={true}
          showDelete={hasRole(IRoleAction.ManageFilters)}
        />
      </Table.Cell>
    </Table.Row>
  );
};

export default FilterListItem;
