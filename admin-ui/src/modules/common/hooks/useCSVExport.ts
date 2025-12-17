import { useState, useCallback } from 'react';
import {
  convertObjectsToCSV,
  CSVRow,
  downloadCSV,
  RowExtractor,
} from '../utils/csvUtils';
import useAddWork from '../../work/hooks/useAddWork';
import { IWorkType } from '../../../gql/types';

interface UseCSVExportOptions<T> {
  headers?: string[];
  onError?: (error: unknown) => void;
}

export function useCSVExport<T>(onError) {
  const [isExporting, setIsExporting] = useState(false);
  const { addWork } = useAddWork();
  const exportCSV = useCallback(
    async ({ type, ...params }) => {
      setIsExporting(true);
      try {
        const worker = await addWork({
          type: IWorkType.BulkExport,
          input: {
            ...params,
          },
        });
        return worker?.data?.addWork?._id;
      } catch (error) {
        console.error('Export failed:', error);
        if (onError) onError(error);
        return null;
      } finally {
        setIsExporting(false);
      }
    },
    [onError],
  );

  return { isExporting, exportCSV };
}
