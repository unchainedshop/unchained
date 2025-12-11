import { useState } from 'react';
import { useIntl } from 'react-intl';
import useAddWork from '../../work/hooks/useAddWork';
import { IWorkType } from '../../../gql/types';

interface UseImportOptions<T> {
  validate: (items: T[], intl: any) => string[];
  process: (item: any) => Promise<
    {
      entity: string;
      operation: string;
      payload: any;
    }[]
  >;
}

export const useCSVImport = <T>({ validate, process }: UseImportOptions<T>) => {
  const { addWork } = useAddWork();
  const [isImporting, setIsImporting] = useState(false);
  const intl = useIntl();

  const importItems = async (items: T[]) => {
    const result = {
      success: 0,
      failed: 0,
      created: 0,
      updated: 0,
      errors: [] as string[],
    };
    try {
      setIsImporting(true);

      const errors = validate(items, intl);
      if (errors.length > 0) {
        result.failed++;
        result.errors.push(...errors);
      }
      const events = await process(items);
      await addWork({
        type: IWorkType.BulkImport,
        input: {
          createShouldUpsertIfIDExists: true,
          events,
        },
      });
      result.success = events?.length - result?.failed;
      setIsImporting(false);
      return result;
    } catch (err) {
      console.error('Import failed:', err);
      setIsImporting(false);
    }
  };

  return { isImporting, importItems };
};
