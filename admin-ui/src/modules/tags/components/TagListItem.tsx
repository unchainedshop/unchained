import { useIntl } from 'react-intl';
import Link from 'next/link';
import Badge from '../../common/components/Badge';
import Table from '../../common/components/Table';
import useTagsCount from '../hooks/useTagsCount';

interface TagListItemProps {
  tag: string;
}

const TagListItem = ({ tag }: TagListItemProps) => {
  const { formatMessage } = useIntl();

  const { productsCount, assortmentsCount, usersCount } = useTagsCount({ tag });

  return (
    <Table.Row className="group">
      <Table.Cell>
        <div className="flex items-center">
          <Badge text={tag} color="slate" className="text-sm font-medium" />
        </div>
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap px-6">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {assortmentsCount + productsCount + usersCount}
        </div>
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap px-6">
        <div className="text-sm text-slate-900 dark:text-slate-300">
          {productsCount}
          {productsCount > 0 && (
            <Link
              href={`/products?tags=${encodeURIComponent(tag)}`}
              className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              {formatMessage({
                id: 'view_products',
                defaultMessage: 'view',
              })}
            </Link>
          )}
        </div>
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap px-6">
        <div className="text-sm text-slate-900 dark:text-slate-300">
          {assortmentsCount}
          {assortmentsCount > 0 && (
            <Link
              href={`/assortments?tags=${encodeURIComponent(tag)}`}
              className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              {formatMessage({
                id: 'view_assortments',
                defaultMessage: 'view',
              })}
            </Link>
          )}
        </div>
      </Table.Cell>
      <Table.Cell className="whitespace-nowrap px-6">
        <div className="text-sm text-slate-900 dark:text-slate-300">
          {usersCount}
          {usersCount > 0 && (
            <Link
              href={`/users?tags=${encodeURIComponent(tag)}`}
              className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              {formatMessage({
                id: 'view_users',
                defaultMessage: 'view',
              })}
            </Link>
          )}
        </div>
      </Table.Cell>
    </Table.Row>
  );
};

export default TagListItem;
