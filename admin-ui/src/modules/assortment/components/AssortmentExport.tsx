import React, { useCallback } from 'react';
import Button from '../../common/components/Button';
import { useIntl } from 'react-intl';
import { useAssortmentExport } from '../hooks/useAssortmentExport';
import useAssortmentsCount from '../hooks/useAssortmentsCount';
import ExportOptionsForm from '../../common/components/ExportOptionsForm';
import useModal from '../../modal/hooks/useModal';

const AssortmentExport = ({
  includeInactive,
  includeLeaves,
  queryString,
  tags,
}) => {
  const { setModal } = useModal();
  const { assortmentsCount, loading } = useAssortmentsCount({
    queryString,
    includeInactive,
    includeLeaves,
    tags,
  });

  const { exportAssortments, isLoading } = useAssortmentExport();

  const { formatMessage } = useIntl();
  const assortmentExportOptions = [
    {
      key: 'exportAssortments',
      label: formatMessage({
        id: 'assortments',
        defaultMessage: 'Assortments',
      }),
      defaultChecked: true,
    },
    {
      key: 'exportAssortmentProducts',
      label: formatMessage({
        id: 'assortment_products',
        defaultMessage: 'Assortment products',
      }),
      defaultChecked: true,
    },
    {
      key: 'exportAssortmentChildren',
      label: formatMessage({
        id: 'assortment_links',
        defaultMessage: 'Assortment links',
      }),
      defaultChecked: false,
    },
    {
      key: 'exportAssortmentFilters',
      label: formatMessage({
        id: 'assortment_filters',
        defaultMessage: 'Assortment filters',
      }),
      defaultChecked: false,
    },
  ];
  const handleSubmit = useCallback(
    async (data) => {
      exportAssortments({
        queryString,
        includeInactive,
        includeLeaves,
        tags,
        ...data,
      });
      setModal(null);
    },
    [queryString, includeInactive, includeLeaves, tags],
  );
  if (loading) return null;

  return (
    <Button
      onClick={async () => {
        setModal(
          <ExportOptionsForm
            options={assortmentExportOptions}
            onSubmit={handleSubmit}
          />,
        );
      }}
      disabled={isLoading || !assortmentsCount}
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
