import { useState, useCallback } from 'react';
import {
  convertObjectsToCSV,
  CSVRow,
  downloadCSV,
  RowExtractor,
} from '../utils/csvUtils';

interface UseCSVExportOptions<T> {
  headers?: string[];
  onError?: (error: unknown) => void;
}

export function useCSVExport<T>(
  data: T[],
  extractRow: RowExtractor<T>,
  options?: UseCSVExportOptions<T>,
) {
  const { headers: explicitHeaders, onError } = options || {};
  const [isExporting, setIsExporting] = useState(false);

  const exportCSV = useCallback(
    (filenamePrefix = 'export', overrideData) => {
      const normalizedData = overrideData || data || [];
      if (!normalizedData?.length) return;
      setIsExporting(true);

      try {
        const rows: CSVRow[] = overrideData.map(extractRow);
        const headers: string[] =
          explicitHeaders ??
          (() => {
            const keySet = rows.reduce<Set<string>>((acc, row) => {
              Object.keys(row).forEach((key) => acc.add(key));
              return acc;
            }, new Set<string>());
            return Array.from(keySet);
          })();

        const csvContent = convertObjectsToCSV(headers, rows);

        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${filenamePrefix}_${timestamp}.csv`;

        downloadCSV(csvContent, filename);
      } catch (error) {
        console.error('Export failed:', error);
        if (onError) onError(error);
      } finally {
        setIsExporting(false);
      }
    },
    [data, extractRow, explicitHeaders, onError],
  );

  return { isExporting, exportCSV };
}
