import type { UnchainedCore } from '../../core-index.ts';
import generateCSVFileAndURL from './generateCSVFileAndUrl.js';
import z from 'zod';

export const FilterExportPayloadSchema = z.object({
  exportFilters: z.boolean().optional(),
  exportFilterOptions: z.boolean().optional(),
  queryString: z.string().optional(),
  includeInactive: z.boolean().optional(),
});

export interface FilterExportParams {
  exportFilters?: boolean;
  exportFilterOptions?: boolean;
  [key: string]: any;
}

const FILTER_CSV_SCHEMA = {
  filterFields: ['_id', 'key', 'type', 'isActive'],
  optionFields: ['optionId', 'filterId', 'value'],
  textFields: ['title', 'subtitle'],
};

const buildFilterHeaders = (locales: string[]) => [
  ...FILTER_CSV_SCHEMA.filterFields,
  ...locales.flatMap((locale) =>
    FILTER_CSV_SCHEMA.textFields.map((field) => `texts.${locale}.${field}`),
  ),
  'meta',
];

const buildOptionHeaders = (locales: string[]) => [
  ...FILTER_CSV_SCHEMA.optionFields,
  ...locales.flatMap((locale) =>
    FILTER_CSV_SCHEMA.textFields.map((field) => `texts.${locale}.${field}`),
  ),
];

const mapTextsToRow = (row: Record<string, any>, texts: Record<string, any>, locales: string[]) => {
  locales.forEach((locale) => {
    const t = texts[locale] || {};
    FILTER_CSV_SCHEMA.textFields.forEach((field) => {
      row[`texts.${locale}.${field}`] = t[field] ?? '';
    });
  });
};

const fetchTexts = async (
  modules: UnchainedCore['modules'],
  filterId: string,
  filterOptionValue?: string,
) => {
  const texts = await modules.filters.texts.findTexts({ filterId, filterOptionValue });
  return texts.reduce((acc, t) => ({ ...acc, [t.locale]: t }), {} as Record<string, any>);
};

const exportFiltersHandler = async (
  { exportFilterOptions, exportFilters, ...params }: FilterExportParams,
  locales: string[],
  unchainedAPI: UnchainedCore,
) => {
  const { modules } = unchainedAPI;
  const filters = await modules.filters.findFilters({ ...params });

  const filterRows: Record<string, any>[] = [];
  const optionRows: Record<string, any>[] = [];

  for await (const filter of filters) {
    if (exportFilters) {
      const filterTexts = await fetchTexts(modules, filter._id);
      const row: Record<string, any> = {
        _id: filter._id,
        key: filter.key,
        type: filter.type,
        isActive: filter.isActive,
        meta: typeof filter?.meta === 'object' ? JSON.stringify(filter.meta) : '',
      };

      mapTextsToRow(row, filterTexts, locales);
      filterRows.push(row);
    }
    if (exportFilterOptions) {
      for await (const optionValue of filter.options) {
        const optionTexts = await fetchTexts(modules, filter._id, optionValue);
        const optionRow: Record<string, any> = {
          optionId: `${filter._id}:${optionValue}`,
          filterId: filter._id,
          value: optionValue,
        };
        mapTextsToRow(optionRow, optionTexts, locales);
        optionRows.push(optionRow);
      }
    }
  }

  const filtersCSV = exportFilters
    ? await generateCSVFileAndURL({
        headers: buildFilterHeaders(locales),
        rows: filterRows,
        directoryName: 'exports',
        fileName: 'filters_export.csv',
        unchainedAPI,
      })
    : null;
  const optionsCSV = exportFilterOptions
    ? await generateCSVFileAndURL({
        headers: buildOptionHeaders(locales),
        rows: optionRows,
        directoryName: 'exports',
        fileName: 'filters_options_export.csv',
        unchainedAPI,
      })
    : null;

  return { filters: filtersCSV, filterOptions: optionsCSV };
};

export default exportFiltersHandler;

exportFiltersHandler.payloadSchema = FilterExportPayloadSchema;
