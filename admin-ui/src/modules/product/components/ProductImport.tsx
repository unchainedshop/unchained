import React, { useRef } from 'react';
import { IRoleAction } from '../../../gql/types';

import { useIntl } from 'react-intl';
import Button from '../../common/components/Button';
import useAuth from '../../Auth/useAuth';
import useModal from '../../modal/hooks/useModal';
import { useCSVImport } from '../../common/hooks/useCSVImport';
import usePrepareProductImport, {
  productMapper,
  validateProduct,
} from '../hooks/usePrepareProductImport';

import parseCSV from 'papaparse';
import ImportResultMessage from '../../modal/components/ImportResultMessage';

const ProductImport = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { setModal } = useModal();
  const { prepareProductImport } = usePrepareProductImport();

  const { isImporting, importItems } = useCSVImport({
    validate: validateProduct,
    process: prepareProductImport,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setModal(
        formatMessage({
          id: 'select_valid_csv_error',
          defaultMessage: 'Please select a valid CSV file.',
        }),
      );
      return;
    }

    const content = await file.text();

    const productsCSV = parseCSV.parse(content, {
      header: true,
      skipEmptyLines: true,
    });
    const products = productsCSV.data.map(productMapper);
    const result = await importItems(products);
    setModal(
      <ImportResultMessage
        result={result}
        entityName="products"
        onClose={() => setModal('')}
      />,
    );

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!hasRole(IRoleAction.ManageProducts)) return null;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
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
