import { useCallback } from 'react';
import Button from '../../common/components/Button';
import { useIntl } from 'react-intl';
import { useAssortmentExport } from '../hooks/useAssortmentExport';
import useAssortmentsCount from '../hooks/useAssortmentsCount';
import ExportOptionsForm, {
  ExportOption,
} from '../../common/components/ExportOptionsForm';
import useModal from '../../modal/hooks/useModal';

interface AssortmentExportProps {
  includeInactive?: boolean;
  includeLeaves?: boolean;
  queryString?: string;
  tags?: string[];
}

const AssortmentExport = ({
  includeInactive,
  includeLeaves,
  queryString,
  tags,
}: AssortmentExportProps) => {
  const { setModal } = useModal();
  const { assortmentsCount, loading } = useAssortmentsCount({
    queryString,
    includeInactive,
    includeLeaves,
    tags,
  });
  const { exportAssortments, isExporting } = useAssortmentExport();
  const { formatMessage } = useIntl();

  const EXPORT_OPTIONS: ExportOption[] = [
    {
      key: 'exportAssortments',
      label: formatMessage({
        id: 'assortments',
        defaultMessage: 'Assortments',
      }),
      defaultChecked: true,
    },
    {
      key: 'exportProducts',
      label: formatMessage({
        id: 'assortment_products',
        defaultMessage: 'Assortment products',
      }),
      defaultChecked: true,
    },
    {
      key: 'exportLinks',
      label: formatMessage({
        id: 'assortment_links',
        defaultMessage: 'Assortment links',
      }),
      defaultChecked: true,
    },
    {
      key: 'exportFilters',
      label: formatMessage({
        id: 'assortment_filters',
        defaultMessage: 'Assortment filters',
      }),
      defaultChecked: true,
    },
  ];

  const handleSubmit = useCallback(
    async (data: Record<string, boolean>) => {
      await exportAssortments({
        queryString,
        includeInactive,
        includeLeaves,
        tags,
        ...data,
      });
      setModal(null);
    },
    [queryString, includeInactive, includeLeaves, tags, exportAssortments, setModal],
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
      disabled={isExporting || !assortmentsCount}
      variant="secondary"
      text={
        isExporting
          ? formatMessage({ id: 'exporting', defaultMessage: 'Exporting...' })
          : formatMessage({ id: 'export', defaultMessage: 'Export' })
      }
    />
  );
};

export default AssortmentExport;
