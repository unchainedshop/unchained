import { useState } from 'react';
import { useIntl } from 'react-intl';
import useAddWork from '../../work/hooks/useAddWork';
import { IWorkType } from '../../../gql/types';
import { useRouter } from 'next/router';

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

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
  const router = useRouter();

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
        result.failed++;
        result.errors.push(...errors);
      }
      const events = await process(items);
      const work = await addWork({
        type: IWorkType.BulkImport,
        input: {
          createShouldUpsertIfIDExists: true,
          events,
        },
      });

      result.success = events.length - result.failed;
      setIsImporting(false);
      router.push(`/works?workerId=${work?.data?.addWork?._id}`);

      return result;
    } catch (err) {
      console.error('Import failed:', err);
      setIsImporting(false);
    }
  };

  return { isImporting, importItems };
};
