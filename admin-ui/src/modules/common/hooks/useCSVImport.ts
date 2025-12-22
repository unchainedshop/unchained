import { useState } from 'react';
import { useIntl } from 'react-intl';
import useAddWork from '../../work/hooks/useAddWork';
import { IWorkType } from '../../../gql/types';

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}
const BATCH_SIZE = 100;
export interface UseImportOptions<T> {
  validate: (items: T, intl: any) => string[];
  process: (
    item: T,
  ) => Promise<{ entity: string; operation: string; payload: any }[]>;
}

export const useCSVImport = <T>({ validate, process }: UseImportOptions<T>) => {
  const { addWork } = useAddWork();
  const [isImporting, setIsImporting] = useState(false);
  const intl = useIntl();
  const importItems = async (items: T): Promise<ImportResult | undefined> => {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    try {
      setIsImporting(true);
      const errors = validate(items, intl);
      if (errors.length > 0) {
        result.failed += errors.length;
        result.errors.push(...errors);
      }
      const events = await process(items);
      for (let i = 0; i < events.length; i += BATCH_SIZE) {
        const batch = events.slice(i, i + BATCH_SIZE);
        try {
          await addWork({
            type: IWorkType.BulkImport,
            input: {
              createShouldUpsertIfIDExists: true,
              events: batch,
            },
          });
          result.success += batch.length;
        } catch (batchErr: any) {
          console.error('Batch import failed:', batchErr);
          result.failed += batch.length;
          result.errors.push(
            `Batch starting at index ${i} failed: ${batchErr.message}`,
          );
        }
      }

      setIsImporting(false);
      return result;
    } catch (err: any) {
      console.error('Import failed:', err);
      setIsImporting(false);
      result.errors.push(err.message || 'Unknown error');
      return result;
    }
  };

  return { isImporting, importItems };
};
