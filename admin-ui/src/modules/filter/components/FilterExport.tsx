import { useCallback } from 'react';
import Button from '../../common/components/Button';
import { useIntl } from 'react-intl';
import { useFilterExport } from '../hooks/useFilterExport';
import useFiltersCount from '../hooks/useFiltersCount';
import useModal from '../../modal/hooks/useModal';
import ExportOptionsForm, {
  ExportOption,
} from '../../common/components/ExportOptionsForm';

interface FilterExportProps {
  queryString?: string;
  includeInactive?: boolean;
}

const FilterExport = ({ queryString, includeInactive }: FilterExportProps) => {
  const { formatMessage } = useIntl();
  const { filtersCount, loading } = useFiltersCount({
    queryString,
    includeInactive,
  });
  const { setModal } = useModal();
  const { exportFilters, isExporting } = useFilterExport();

  const EXPORT_OPTIONS: ExportOption[] = [
    {
      key: 'exportFilters',
      label: formatMessage({ id: 'filters', defaultMessage: 'Filters' }),
    },
    {
      key: 'exportFilterOptions',
      label: formatMessage({
        id: 'filter_options',
        defaultMessage: 'Filter options',
      }),
    },
  ];

  const handleSubmit = useCallback(
    async (data: Record<string, boolean>) => {
      await exportFilters({ queryString, includeInactive, ...data });
      setModal(null);
    },
    [queryString, includeInactive, exportFilters, setModal],
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
      disabled={isExporting || !filtersCount}
      variant="secondary"
      text={
        isExporting
          ? formatMessage({ id: 'exporting', defaultMessage: 'Exporting...' })
          : formatMessage({ id: 'export', defaultMessage: 'Export' })
      }
    />
  );
};

export default FilterExport;
