import React from 'react';
import { IRoleAction } from '../../../gql/types';

import { useIntl } from 'react-intl';
import Button from '../../common/components/Button';
import useAuth from '../../Auth/useAuth';
import useModal from '../../modal/hooks/useModal';
import { useCSVImport } from '../../common/hooks/useCSVImport';
import usePrepareProductImport, {
  validateProduct,
} from '../hooks/usePrepareProductImport';
import ImportResultMessage from '../../modal/components/ImportResultMessage';
import ProductImportForm from './ProductImportForm';

const ProductImport = () => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { setModal } = useModal();
  const { prepareProductImport } = usePrepareProductImport();

  const { isImporting, importItems } = useCSVImport({
    validate: validateProduct,
    process: prepareProductImport,
  });

  if (!hasRole(IRoleAction.ManageProducts)) return null;

  const handleOpenImport = () => {
    setModal(
      <ProductImportForm
        onImport={async (normalizedProducts: any) => {
          const result = await importItems(normalizedProducts);
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
    <>
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
    </>
  );
};

export default ProductImport;
