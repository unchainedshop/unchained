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
import { AssortmentImportPayload } from '../types';
import { toast } from 'react-toastify';

const AssortmentImport = () => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { setModal } = useModal();
  const { prepareAssortmentImport } = usePrepareAssortmentImport();

  const { isImporting, importItems } = useCSVImport<AssortmentImportPayload>({
    validate: validateAssortment,
    process: prepareAssortmentImport,
  });

  const handleOpenImport = () => {
    setModal(
      <AssortmentImportForm
        onImport={async (normalizedProducts: AssortmentImportPayload) => {
          const result = await importItems(normalizedProducts);
          setModal(null);
          toast(
            <ImportResultMessage result={result} entityName="Assortments" />,
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
