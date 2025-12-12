import React from 'react';
import Button from '../../common/components/Button';
import { useIntl } from 'react-intl';
import useFilters from '../hooks/useFilters';
import { useFilterExport } from '../hooks/useFilterExport';

const FilterExport = ({ queryString, includeInactive, sortKeys }) => {
  const { filters, loading, client } = useFilters({
    queryString,
    sort: sortKeys,
    includeInactive,
  });

  const { exportFilters, isLoading } = useFilterExport(filters, client);
  const { formatMessage } = useIntl();

  if (loading) return null;

  return (
    <Button
      onClick={exportFilters}
      disabled={isLoading || !filters.length}
      variant="secondary"
      text={
        isLoading
          ? formatMessage({
              id: 'loading_translations',
              defaultMessage: 'Loading translations...',
            })
          : formatMessage({ id: 'export', defaultMessage: 'Export' })
      }
    />
  );
};

export default FilterExport;
