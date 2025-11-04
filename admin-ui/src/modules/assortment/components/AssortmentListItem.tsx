import Link from 'next/link';
import { useIntl } from 'react-intl';
import { useRouter } from 'next/router';
import Badge from '../../common/components/Badge';
import MediaAvatar from '../../common/components/MediaAvatar';
import Table from '../../common/components/Table';
import TableActionsMenu from '../../common/components/TableActionsMenu';
import generateUniqueId from '../../common/utils/getUniqueId';
import useAuth from '../../Auth/useAuth';
import useModal from '../../modal/hooks/useModal';
import DangerMessage from '../../modal/components/DangerMessage';
import useUpdateAssortment from '../hooks/useUpdateAssortment';
import useRemoveAssortment from '../hooks/useRemoveAssortment';

const AssortmentListItem = ({ assortment, showAvatar }) => {
  const { formatMessage } = useIntl();
  const router = useRouter();
  const { hasRole } = useAuth();
  const { setModal } = useModal();
  const { updateAssortment } = useUpdateAssortment();
  const { removeAssortment } = useRemoveAssortment();
  const STATUS = {
    true: formatMessage({ id: 'active', defaultMessage: 'Active' }),
    false: formatMessage({ id: 'in_active', defaultMessage: 'In-Active' }),
  };

  const handleEdit = () => {
    router.push(`/assortments?assortmentSlug=${generateUniqueId(assortment)}`);
  };

  const handleDelete = async () => {
    await setModal(
      <DangerMessage
        onCancelClick={async () => setModal('')}
        message={formatMessage({
          id: 'delete_assortment_warning',
          defaultMessage:
            'This action will permanently delete this assortment and all associated data. Are you sure you want to continue?',
        })}
        onOkClick={async () => {
          setModal('');
          await removeAssortment({ assortmentId: assortment._id });
        }}
        okText={formatMessage({
          id: 'delete_assortment',
          defaultMessage: 'Delete Assortment',
        })}
      />,
    );
  };

  const updateAssortmentSequence = async (e) => {
    if (e.target.value) {
      await updateAssortment({
        assortmentId: assortment?._id,
        assortment: { sequence: parseInt(e.target.value, 10) },
      });
    }
  };

  return (
    <Table.Row>
      <Table.Cell className="whitespace-nowrap">
        <div className="flex items-center text-sm text-slate-900">
          {showAvatar && (
            <MediaAvatar
              file={assortment?.media?.length && assortment.media[0].file}
              className="mr-3"
            />
          )}
          <Link
            href={`/assortments?assortmentSlug=${generateUniqueId(assortment)}`}
            className="text-slate-900 dark:text-slate-300"
          >
            {assortment?.texts?.title || (
              <>
                {assortment._id}{' '}
                <Badge
                  color="blue"
                  text={formatMessage({ id: 'name', defaultMessage: 'Name' })}
                />
              </>
            )}
          </Link>
        </div>
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <Badge
          text={STATUS[assortment.isActive]}
          color={assortment.isActive ? 'emerald' : 'yellow'}
          square
        />
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <div className="flex items-center text-sm text-slate-900">
          {assortment.isRoot && (
            <Badge
              text={formatMessage({
                id: 'root_assortment',
                defaultMessage: 'Root',
              })}
              color="stone"
              square
            />
          )}
        </div>
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <div className="flex items-center text-sm text-slate-900">
          {assortment.isBase && (
            <Badge
              text={formatMessage({
                id: 'assortment_base',
                defaultMessage: 'Base',
              })}
              color="sky"
            />
          )}
        </div>
      </Table.Cell>
      <Table.Cell>
        <input
          type="number"
          id={`${assortment._id}-sequence`}
          className="text-center w-16 shadow-xs focus:ring-slate-900 dark:bg-slate-800 dark:border-slate-700 focus:border-slate-900 block text-sm border-slate-300 rounded-md mr-2 font-semibold text-slate-900 dark:text-slate-300"
          defaultValue={assortment?.sequence}
          onBlur={updateAssortmentSequence}
          disabled={!hasRole('manageAssortments')}
        />
      </Table.Cell>
      <Table.Cell className="text-right">
        <TableActionsMenu
          onEdit={handleEdit}
          onDelete={hasRole('removeAssortment') ? handleDelete : undefined}
          showEdit={true}
          showDelete={hasRole('removeAssortment')}
        />
      </Table.Cell>
    </Table.Row>
  );
};

export default AssortmentListItem;
