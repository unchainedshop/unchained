import { useCallback, useMemo, useState } from 'react';
import { useCSVExport } from '../../common/hooks/useCSVExport';
import { IFilter } from '../../../gql/types';
import { fetchTranslatedTextsForAllFilters } from '../utils/fetchTranslatedTextsForAllFilters';
import useApp from '../../common/hooks/useApp';

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

export const useFilterExport = (filters: IFilter[] | any[], client: any) => {
  const { languageDialectList } = useApp();
  const locales = useMemo(
    () => languageDialectList?.map((l) => l.isoCode) ?? [],
    [languageDialectList],
  );
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);

  const filterHeaders = useMemo(() => buildFilterHeaders(locales), [locales]);
  const optionHeaders = useMemo(
    () => buildFilterOptionHeaders(locales),
    [locales],
  );

  const { exportCSV: exportFilterCSV, isExporting } = useCSVExport(
    filters,
    (f) => f,
    { headers: filterHeaders },
  );

  const { exportCSV: exportOptionCSV } = useCSVExport(filters, (f) => f, {
    headers: optionHeaders,
  });

  const exportFilters = useCallback(async () => {
    setIsLoadingTranslations(true);

    const translationMap = await fetchTranslatedTextsForAllFilters(
      filters,
      client,
    );
    setIsLoadingTranslations(false);

    const filterRows = filters.map((filter) => {
      const row = {
        _id: filter._id,
        key: filter.key,
        type: filter.type,
        isActive: filter.isActive,
      };
      const texts = translationMap?.filters?.[filter._id] || {};
      locales.forEach((locale) => {
        const t = texts[locale] || {};
        FILTER_CSV_SCHEMA.textFields.forEach((field) => {
          row[`texts.${locale}.${field}`] = t[field] ?? '';
        });
      });
      return row;
    });

    const optionRows = [];
    filters.forEach((filter) => {
      (filter.options || []).forEach((option) => {
        const row = {
          optionId: option._id,
          filterId: filter._id,
          value: option.value,
        };
        const texts = translationMap?.options?.[option._id] || {};
        locales.forEach((locale) => {
          const t = texts[locale] || {};
          FILTER_CSV_SCHEMA.textFields.forEach((field) => {
            row[`texts.${locale}.${field}`] = t[field] ?? '';
          });
        });
        optionRows.push(row);
      });
    });

    exportFilterCSV('filters_export', filterRows);
    exportOptionCSV('filter_options_export', optionRows);
  }, [filters, client, locales, exportFilterCSV, exportOptionCSV]);

  return {
    exportFilters,
    isLoading: isLoadingTranslations || isExporting,
    isLoadingTranslations,
    isExporting,
    filterHeaders,
    optionHeaders,
  };
};
