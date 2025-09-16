import Link from 'next/link';
import { useRouter } from 'next/router';

import Badge from './Badge';
import Table from './Table';
import TableActionsMenu from './TableActionsMenu';
import { PROVIDER_TYPE_CLASSES } from '../data/miscellaneous';
import { getInterfaceLabel } from '../utils/utils';
import ActiveInActive from './ActiveInActive';
import ProviderNameConfiguration from './ProviderNameConfiguration';

const ProviderListItem = ({
  provider,
  onRemove,
  providerPath,
  canEdit,
  canDelete,
}) => {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`${providerPath}=${provider?._id}`);
  };

  const handleDelete = async () => {
    await onRemove(provider?._id);
  };
  return (
    <Table.Row>
      <Table.Cell>
        <div className="text-slate-900 dark:text-slate-200">
          <span className="flex items-center">
            <span className="mr-2">
              {getInterfaceLabel(provider?.interface)}
            </span>
            <ActiveInActive isActive={provider?.isActive} />
          </span>

          <ProviderNameConfiguration
            configuration={provider?.configuration}
            color={PROVIDER_TYPE_CLASSES[provider?.type]}
          />
        </div>
      </Table.Cell>

      <Table.Cell>
        <span className="font-semibold">
          <Badge
            text={provider?.type}
            color={PROVIDER_TYPE_CLASSES[provider?.type]}
            square
          />
        </span>
      </Table.Cell>
      {(canEdit || canDelete) && (
        <Table.Cell>
          <TableActionsMenu
            onEdit={canEdit ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            showEdit={canEdit}
            showDelete={canDelete}
          />
        </Table.Cell>
      )}
    </Table.Row>
  );
};

export default ProviderListItem;
