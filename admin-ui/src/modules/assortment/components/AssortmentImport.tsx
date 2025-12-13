import React, { useRef } from 'react';
import { IRoleAction } from '../../../gql/types';

import { useIntl } from 'react-intl';
import Button from '../../common/components/Button';
import useAuth from '../../Auth/useAuth';
import useModal from '../../modal/hooks/useModal';
import { useCSVImport } from '../../common/hooks/useCSVImport';

import parseCSV from 'papaparse';
import ImportResultMessage from '../../modal/components/ImportResultMessage';
import usePrepareAssortmentImport, {
  validateAssortment,
} from '../hooks/usePrepareAssortmentImport';

export interface AssortmentCSVRow {
  _id?: string;
  isActive?: string;
  isBase?: string;
  isRoot?: string;
  sequence?: string;
  tags?: string;
  [key: string]: any;
}

const AssortmentImport = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { setModal } = useModal();
  const { prepareAssortmentImport } = usePrepareAssortmentImport();

  const { isImporting, importItems } = useCSVImport<AssortmentCSVRow>({
    validate: validateAssortment,
    process: prepareAssortmentImport,
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

    const assortmentsCSV = parseCSV.parse(content, {
      header: true,
      skipEmptyLines: true,
    });
    const result = await importItems(assortmentsCSV?.data);
    setModal(
      <ImportResultMessage
        result={result}
        entityName="assortments"
        onClose={() => setModal('')}
      />,
    );

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!hasRole(IRoleAction.ManageAssortments)) return null;

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

export default AssortmentImport;
