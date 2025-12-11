import React, { useCallback, useState, useMemo } from 'react';
import Button from '../../common/components/Button';
import { fetchTranslatedTextsForAllFilters } from '../utils/fetchTranslatedTextsForAllFilters';
import { useCSVExport } from '../../common/hooks/useCSVExport';
import useFilters from '../hooks/useFilters';
import useApp from '../../common/hooks/useApp';
import { useIntl } from 'react-intl';

const FILTER_SCHEMA = {
  filterFields: ['_id', 'key', 'type', 'isActive', 'created', 'updated'],
  optionFields: ['optionId', 'filterId', 'value'],
  textFields: ['title', 'subtitle'],
};

const buildFilterHeaders = (locales: string[]) => [
  ...FILTER_SCHEMA.filterFields,
  ...locales.flatMap((locale) =>
    FILTER_SCHEMA.textFields.map((field) => `texts.${locale}.${field}`),
  ),
];

const buildFilterOptionHeaders = (locales: string[]) => [
  ...FILTER_SCHEMA.optionFields,
  ...locales.flatMap((locale) =>
    FILTER_SCHEMA.textFields.map((field) => `texts.${locale}.${field}`),
  ),
];

const FilterExport = ({ queryString, includeInactive, sortKeys }) => {
  const { filters, loading, client } = useFilters({
    queryString,
    sort: sortKeys,
    includeInactive,
  });
  const { languageDialectList } = useApp();
  const { formatMessage } = useIntl();

  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);

  const locales = useMemo(
    () => languageDialectList?.map((l) => l.isoCode) ?? [],
    [languageDialectList],
  );

  const filterHeaders = useMemo(() => buildFilterHeaders(locales), [locales]);
  const optionHeaders = useMemo(
    () => buildFilterOptionHeaders(locales),
    [locales],
  );

  const { exportCSV: exportFilterCSV } = useCSVExport(filters, (f) => f, {
    headers: filterHeaders,
  });
  const { exportCSV: exportOptionCSV } = useCSVExport(filters, (f) => f, {
    headers: optionHeaders,
  });

  const handleExport = useCallback(async () => {
    setIsLoadingTranslations(true);

    const translationMap = await fetchTranslatedTextsForAllFilters(
      filters,
      client,
    );
    setIsLoadingTranslations(false);
    const filterRows = filters.map((filter) => {
      const row: Record<string, any> = {};

      FILTER_SCHEMA.filterFields.forEach((key) => {
        row[key] = filter[key] ?? '';
      });

      const texts = translationMap?.filters[filter._id] || {};
      locales.forEach((locale) => {
        const t = texts[locale] || {};
        FILTER_SCHEMA.textFields.forEach((field) => {
          row[`texts.${locale}.${field}`] = t[field] ?? '';
        });
      });

      return row;
    });
    const optionRows: Record<string, any>[] = [];
    filters.forEach((filter) => {
      const options = filter.options || [];
      options.forEach((option) => {
        const row: Record<string, any> = {};
        row.optionId = option._id;
        row.filterId = filter._id;
        row.value = option.value;

        const texts = translationMap?.options[option._id] || {};
        locales.forEach((locale) => {
          const t = texts[locale] || {};
          FILTER_SCHEMA.textFields.forEach((field) => {
            row[`texts.${locale}.${field}`] = t[field] ?? '';
          });
        });

        optionRows.push(row);
      });
    });
    exportFilterCSV('filters_export', filterRows);
    exportOptionCSV('filter_options_export', optionRows);
  }, [filters, client, locales, exportFilterCSV, exportOptionCSV]);

  if (loading) return null;

  return (
    <Button
      onClick={handleExport}
      disabled={isLoadingTranslations || !filters.length}
      variant="secondary"
      text={
        isLoadingTranslations
          ? formatMessage({
              id: 'loading_translations',
              defaultMessage: 'Loading translations...',
            })
          : formatMessage({ id: 'export', defaultMessage: 'Export' })
      }
    />
  );
};

export default FilterExport;
