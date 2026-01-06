import { useCallback } from 'react';
import Button from '../../common/components/Button';
import { useIntl } from 'react-intl';
import { useUserExport } from '../hooks/useUserExport';
import ExportOptionsForm, {
  ExportOption,
} from '../../common/components/ExportOptionsForm';
import useModal from '../../modal/hooks/useModal';
import useUser from '../hooks/useUser';

interface UserExportProps {
  userId: string;
}

const UserExport = ({
  userId
}: UserExportProps) => {
  const { setModal } = useModal();
  const { user, loading } = useUser({
    userId,    
  });
  const { exportUser, isExporting } = useUserExport();
  const { formatMessage } = useIntl();

  const EXPORT_OPTIONS: ExportOption[] = [
    {
      key: 'exportBookmarks',
      label: formatMessage({
        id: 'bookmarks',
        defaultMessage: 'Bookmarks',
      }),
      defaultChecked: true,
    },
    {
      key: 'exportOrders',
      label: formatMessage({
        id: 'orders',
        defaultMessage: 'Orders',
      }),
      defaultChecked: true,
    },
    {
      key: 'exportReviews',
      label: formatMessage({
        id: 'reviews',
        defaultMessage: 'Reviews',
      }),
      defaultChecked: true,
    },
    {
      key: 'exportEvents',
      label: formatMessage({
        id: 'events',
        defaultMessage: 'Events',
      }),
      defaultChecked: true,
    },
    {
      key: 'exportQuotations',
      label: formatMessage({
        id: 'quotations',
        defaultMessage: 'Quotations',
      }),
      defaultChecked: true,
    },
    {
      key: 'exportEnrollments',
      label: formatMessage({
        id: 'enrollments',
        defaultMessage: 'Enrollments',
      }),
      defaultChecked: true,
    },
  ];

  const handleSubmit = useCallback(
    async (data: Record<string, boolean>) => {
      await exportUser({
        userId,
        ...data,
      });
      setModal(null);
    },
    [userId, exportUser, setModal],
  );

  if (loading) return null;

  return (
    <Button
      onClick={() => {
        setModal(
          <ExportOptionsForm
            options={EXPORT_OPTIONS}
            onSubmit={handleSubmit}
            loading={isExporting}
          />,
        );
      }}
      disabled={isExporting || !user}
      variant="secondary"
      text={
        isExporting
          ? formatMessage({ id: 'exporting', defaultMessage: 'Exporting...' })
          : formatMessage({ id: 'export', defaultMessage: 'Export' })
      }
    />
  );
};

export default UserExport;
