import React, { useCallback, useState, useMemo } from 'react';
import Button from '../../common/components/Button';
import { fetchTranslatedTextsForAllAssortments } from '../utils/fetchTranslatedTextsForAllAssortments';
import { useCSVExport } from '../../common/hooks/useCSVExport';
import useApp from '../../common/hooks/useApp';
import { useIntl } from 'react-intl';
import useAssortments from '../hooks/useAssortments';
import { IAssortment } from '../../../gql/types';

const ASSORTMENT_SCHEMA = {
  base: ['_id', 'isActive', 'isBase', 'isRoot', 'sequence', 'tags'],
  textFields: ['title', 'subtitle', 'description', 'slug'],
};

const buildHeaders = (locales: string[]) => [
  ...ASSORTMENT_SCHEMA.base,
  ...locales.flatMap((locale) =>
    ASSORTMENT_SCHEMA.textFields.map((field) => `texts.${locale}.${field}`),
  ),
];

const AssortmentExport = () => {
  const { assortments, loading, client } = useAssortments({ limit: 0 });
  const { languageDialectList } = useApp();
  const { formatMessage } = useIntl();

  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);

  const locales = useMemo(
    () => languageDialectList?.map((l) => l.isoCode) ?? [],
    [languageDialectList],
  );

  const headersBase = useMemo(() => buildHeaders(locales), [locales]);

  const { exportCSV, isExporting } = useCSVExport(assortments, (p) => p, {
    headers: headersBase,
  });

  const handleExport = useCallback(async () => {
    setIsLoadingTranslations(true);

    const translationMap = await fetchTranslatedTextsForAllAssortments(
      assortments as IAssortment[],
      client,
    );
    setIsLoadingTranslations(false);

    const translations = {};
    for (const assortmentId in translationMap) {
      translations[assortmentId] = {};
      for (const t of translationMap[assortmentId]) {
        translations[assortmentId][t.locale] = t;
      }
    }

    const rows = assortments.map(({ ...assortment }) => {
      const row: Record<string, any> = assortment;
      ASSORTMENT_SCHEMA.base.forEach((key) => {
        row[key] = assortment[key] ?? '';
      });

      const assortmentTexts = translations[assortment._id] || {};

      locales.forEach((locale) => {
        const text = assortmentTexts[locale] || {};

        ASSORTMENT_SCHEMA.textFields.forEach((field) => {
          let value = text[field];

          if (Array.isArray(value)) value = value.join(';');

          row[`texts.${locale}.${field}`] = value ?? '';
        });
      });

      return row;
    });

    exportCSV('assortments_export', rows);
  }, [assortments, client, exportCSV, locales]);

  if (loading) return null;

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting || isLoadingTranslations || !assortments.length}
      variant="secondary"
      text={
        isLoadingTranslations
          ? formatMessage({
              id: 'loading_translations',
              defaultMessage: 'Loading translations...',
            })
          : isExporting
            ? formatMessage({ id: 'exporting', defaultMessage: 'Exporting...' })
            : formatMessage({ id: 'export', defaultMessage: 'Export' })
      }
    />
  );
};

export default AssortmentExport;
