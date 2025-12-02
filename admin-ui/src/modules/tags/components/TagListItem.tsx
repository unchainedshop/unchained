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

  const { productsCount, assortmentsCount } = useTagsCount({ tag });

  return (
    <Table.Row className="group">
      {/* Tag Name */}
      <Table.Cell>
        <div className="flex items-center">
          <Badge text={tag} color="slate" className="text-sm font-medium" />
        </div>
      </Table.Cell>

      {/* Total Usage */}
      <Table.Cell className="whitespace-nowrap px-6">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {assortmentsCount + productsCount}
        </div>
      </Table.Cell>

      {/* Products Usage */}
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

      {/* Assortments Usage */}
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

      {/* Actions */}
      {/*    <Table.Cell className="whitespace-nowrap px-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleEdit}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title={formatMessage({
              id: 'edit_tag',
              defaultMessage: 'Edit tag',
            })}
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          {tag.usage.total === 0 && (
            <button
              onClick={handleDelete}
              className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title={formatMessage({
                id: 'delete_tag',
                defaultMessage: 'Delete tag',
              })}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </Table.Cell> */}
    </Table.Row>
  );
};

export default TagListItem;