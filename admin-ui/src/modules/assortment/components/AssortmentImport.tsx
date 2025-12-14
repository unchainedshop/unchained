import React from 'react';
import { IRoleAction } from '../../../gql/types';

import { useIntl } from 'react-intl';
import Button from '../../common/components/Button';
import useAuth from '../../Auth/useAuth';
import useModal from '../../modal/hooks/useModal';
import { useCSVImport } from '../../common/hooks/useCSVImport';
import ImportResultMessage from '../../modal/components/ImportResultMessage';
import usePrepareAssortmentImport, {
  validateAssortment,
} from '../hooks/usePrepareAssortmentImport';
import AssortmentImportForm from './AssortmentImportForm';

const AssortmentImport = () => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { setModal } = useModal();
  const { prepareAssortmentImport } = usePrepareAssortmentImport();

  const { isImporting, importItems } = useCSVImport({
    validate: validateAssortment,
    process: prepareAssortmentImport,
  });

  const handleOpenImport = () => {
    setModal(
      <AssortmentImportForm
        onImport={async (normalizedProducts: any) => {
          const result = await importItems(normalizedProducts);
          setModal(
            <ImportResultMessage
              result={result}
              entityName="assortments"
              onClose={() => setModal('')}
            />,
          );
        }}
      />,
    );
  };

  if (!hasRole(IRoleAction.ManageAssortments)) return null;

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

export default AssortmentImport;
