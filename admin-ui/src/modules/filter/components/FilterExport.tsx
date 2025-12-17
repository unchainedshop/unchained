import React, { useCallback } from 'react';
import Button from '../../common/components/Button';
import { useIntl } from 'react-intl';
import { useFilterExport } from '../hooks/useFilterExport';
import useFiltersCount from '../hooks/useFiltersCount';
import useModal from '../../modal/hooks/useModal';
import ExportOptionsForm, {
  ExportOption,
} from '../../common/components/ExportOptionsForm';

const FilterExport = ({ queryString, includeInactive }) => {
  const { formatMessage } = useIntl();

  const { filtersCount, loading } = useFiltersCount({
    queryString,
    includeInactive,
  });
  const { setModal } = useModal();

  const { exportFilters } = useFilterExport();

  const FILTER_EXPORT_OPTIONS: ExportOption[] = [
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
    async (data) => {
      exportFilters({ queryString, includeInactive, ...data });
      setModal(null);
    },
    [queryString, includeInactive],
  );
  if (loading) return null;

  return (
    <Button
      onClick={() => {
        setModal(
          <ExportOptionsForm
            options={FILTER_EXPORT_OPTIONS}
            onSubmit={handleSubmit}
          />,
        );
      }}
      disabled={!filtersCount}
      variant="secondary"
      text={formatMessage({ id: 'export', defaultMessage: 'Export' })}
    />
  );
};

export default FilterExport;
