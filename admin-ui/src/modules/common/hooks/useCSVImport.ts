import { useState } from 'react';
import { useIntl } from 'react-intl';

interface UseImportOptions<T> {
  validate: (item: T, intl: any) => string[];
  process: (item: T[]) => Promise<'created' | 'updated'>;
}

export const useCSVImport = <T>({ validate, process }: UseImportOptions<T>) => {
  const [isImporting, setIsImporting] = useState(false);
  const intl = useIntl();

  const importItems = async (items: T[]) => {
    try {
      const action = await process(items);
    } catch (err) {
      console.error('Import failed:', err);
    }
  };

  return { isImporting, importItems };
};
