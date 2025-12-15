import React from 'react';
import Button from '../../common/components/Button';
import { useIntl } from 'react-intl';
import useAssortments from '../hooks/useAssortments';
import { useAssortmentExport } from '../hooks/useAssortmentExport';
import useApp from '../../common/hooks/useApp';

const AssortmentExport = ({
  includeInactive,
  includeLeaves,
  queryString,
  tags,
  sort,
}) => {
  const { selectedLocale } = useApp();
  const { assortments, loading, client } = useAssortments({
    limit: 0,
    queryString,
    includeInactive,
    includeLeaves,
    tags,
    sort,
    forceLocale: selectedLocale,
  });

  const { exportAssortments, isLoading } = useAssortmentExport(
    assortments,
    client,
  );

  const { formatMessage } = useIntl();

  if (loading) return null;

  return (
    <Button
      onClick={exportAssortments}
      disabled={isLoading || !assortments.length}
      variant="secondary"
      text={
        isLoading
          ? formatMessage({ id: 'exporting', defaultMessage: 'Exporting...' })
          : formatMessage({ id: 'export', defaultMessage: 'Export' })
      }
    />
  );
};

export default AssortmentExport;
