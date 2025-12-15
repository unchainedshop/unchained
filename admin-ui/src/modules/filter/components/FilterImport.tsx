import React from 'react';
import { IRoleAction } from '../../../gql/types';
import { useIntl } from 'react-intl';
import Button from '../../common/components/Button';
import useAuth from '../../Auth/useAuth';
import useModal from '../../modal/hooks/useModal';
import { useCSVImport } from '../../common/hooks/useCSVImport';
import {
  usePrepareFilterImport,
  validateFilter,
} from '../hooks/usePrepareFilterImport';
import FilterImportForm from './FilterImportForm';
import ImportResultMessage from '../../modal/components/ImportResultMessage';
import { FilterImportPayload } from '../types';

const FilterImport = () => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { setModal } = useModal();
  const { prepareFilterImport } = usePrepareFilterImport();
  const { isImporting, importItems } = useCSVImport<FilterImportPayload>({
    validate: validateFilter,
    process: prepareFilterImport,
  });

  if (!hasRole(IRoleAction.ManageProducts)) return null;

  const handleOpenImport = () => {
    setModal(
      <FilterImportForm
        onImport={async (normalizedFilters) => {
          const result = await importItems(normalizedFilters);
          setModal(
            <ImportResultMessage
              result={result}
              entityName="products"
              onClose={() => setModal('')}
            />,
          );
        }}
      />,
    );
  };

  return (
    <Button
      onClick={handleOpenImport}
      disabled={isImporting}
      variant="secondary"
      text={
        isImporting
          ? formatMessage({ id: 'importing', defaultMessage: 'Importing...' })
          : formatMessage({ id: 'import', defaultMessage: 'Import' })
      }
    />
  );
};

export default FilterImport;
