import { useCallback } from 'react';
import { useCSVExport } from '../../common/hooks/useCSVExport';

export const FILTER_CSV_SCHEMA = {
  filterFields: ['_id', 'key', 'type', 'isActive'],
  optionFields: ['optionId', 'filterId', 'value'],
  textFields: ['title', 'subtitle'],
};

export const buildFilterHeaders = (locales: string[]) => [
  ...FILTER_CSV_SCHEMA.filterFields,
  ...locales.flatMap((locale) =>
    FILTER_CSV_SCHEMA.textFields.map((field) => `texts.${locale}.${field}`),
  ),
];

export const buildFilterOptionHeaders = (locales: string[]) => [
  ...FILTER_CSV_SCHEMA.optionFields,
  ...locales.flatMap((locale) =>
    FILTER_CSV_SCHEMA.textFields.map((field) => `texts.${locale}.${field}`),
  ),
];

export const useFilterExport = () => {
  const { exportCSV, isExporting } = useCSVExport();

  const exportFilters = useCallback(
    async (params: Record<string, unknown>) => {
      await exportCSV({ type: 'FILTERS', ...params });
    },
    [exportCSV],
  );

  return { exportFilters, isExporting };
};
