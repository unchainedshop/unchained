import { useCallback, useMemo, useState } from 'react';
import { useCSVExport } from '../../common/hooks/useCSVExport';
import useApp from '../../common/hooks/useApp';
import { fetchTranslatedTextsForAllAssortments } from '../utils/fetchTranslatedTextsForAllAssortments';
import {
  IAssortment,
  IAssortmentFilter,
  IAssortmentLink,
  IAssortmentProduct,
} from '../../../gql/types';

const ASSORTMENT_SCHEMA = {
  base: ['_id', 'isActive', 'isBase', 'isRoot', 'sequence', 'tags'],
  textFields: ['title', 'subtitle', 'description', 'slug'],
  assortmentFilterFields: [
    '_id',
    'assortmentId',
    'filterId',
    'tags',
    'sortKey',
  ],
  assortmentProductFields: [
    '_id',
    'assortmentId',
    'productId',
    'tags',
    'sortKey',
  ],
  assortmentChildrenFields: [
    '_id',
    'assortmentId',
    'assortmentChildId',
    'tags',
    'sortKey',
  ],
};

const buildHeaders = (locales: string[]) => [
  ...ASSORTMENT_SCHEMA.base,
  ...locales.flatMap((locale) =>
    ASSORTMENT_SCHEMA.textFields.map((field) => `texts.${locale}.${field}`),
  ),
];

const buildAssortmentFilterHeaders = () => [
  ...ASSORTMENT_SCHEMA.assortmentFilterFields,
];

const buildAssortmentProductHeaders = () => [
  ...ASSORTMENT_SCHEMA.assortmentProductFields,
];

const buildAssortmentChildrenHeaders = () => [
  ...ASSORTMENT_SCHEMA.assortmentChildrenFields,
];

const mapTranslations = (translationMap: any) => {
  const all: Record<string, any> = {};
  for (const assortmentId in translationMap.assortments) {
    all[assortmentId] = {};
    for (const t of translationMap.assortments[assortmentId]) {
      all[assortmentId][t.locale] = t;
    }
  }
  return all;
};

const buildAssortmentRow = (
  assortment: IAssortment,
  locales: string[],
  translations: any,
) => {
  const row: Record<string, any> = {};
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
};

const buildFilterRows = (
  assortmentId: string,
  filters: IAssortmentFilter[],
) => {
  return (filters || []).map(({ _id, filter, sortKey, tags }) => ({
    _id,
    sortKey,
    tags: tags || '',
    filterId: filter?._id,
    assortmentId,
  }));
};

const buildProductRows = (
  assortmentId: string,
  products: IAssortmentProduct[],
) => {
  return (products || []).map(({ _id, product, sortKey, tags }) => ({
    _id,
    sortKey,
    tags: tags || '',
    productId: product?._id,
    assortmentId,
  }));
};

const buildChildrenRows = (assortmentId: string, links: IAssortmentLink[]) => {
  return (links || [])
    .filter((link) => link?.child?._id !== assortmentId)
    .map(({ _id, child, sortKey, tags }) => ({
      _id,
      sortKey,
      tags: tags || '',
      assortmentChildId: child?._id,
      assortmentId,
    }));
};

export const useAssortmentExport = (
  assortments: IAssortment[] | any[],
  client: any,
) => {
  const { languageDialectList } = useApp();
  const locales = useMemo(
    () => languageDialectList?.map((l) => l.isoCode) ?? [],
    [languageDialectList],
  );

  const headers = useMemo(() => buildHeaders(locales), [locales]);
  const assortmentFilterHeaders = useMemo(
    () => buildAssortmentFilterHeaders(),
    [],
  );
  const assortmentProductHeaders = useMemo(
    () => buildAssortmentProductHeaders(),
    [],
  );
  const assortmentChildrenHeaders = useMemo(
    () => buildAssortmentChildrenHeaders(),
    [],
  );

  const { exportCSV, isExporting } = useCSVExport(assortments, (a) => a, {
    headers,
  });
  const { exportCSV: exportAssortmentFiltersCSV } = useCSVExport(
    assortments,
    (a) => a,
    {
      headers: assortmentFilterHeaders,
    },
  );
  const { exportCSV: exportAssortmentProductsCSV } = useCSVExport(
    assortments,
    (a) => a,
    {
      headers: assortmentProductHeaders,
    },
  );

  const { exportCSV: exportAssortmentChildrenCSV } = useCSVExport(
    assortments,
    (a) => a,
    {
      headers: assortmentChildrenHeaders,
    },
  );

  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);

  const exportAssortments = useCallback(async () => {
    setIsLoadingTranslations(true);

    const translationMap = await fetchTranslatedTextsForAllAssortments(
      assortments,
      client,
    );
    setIsLoadingTranslations(false);
    const translations = mapTranslations(translationMap);
    const assortmentRows = [];
    const assortmentFiltersRows = [];
    const childrenRows = [];
    const assortmentProductRows = [];

    for (const assortment of assortments) {
      assortmentRows.push(
        buildAssortmentRow(assortment, locales, translations),
      );
      assortmentFiltersRows.push(
        ...buildFilterRows(
          assortment._id,
          translationMap?.filters?.[assortment?._id],
        ),
      );
      assortmentProductRows.push(
        ...buildProductRows(
          assortment._id,
          translationMap?.products?.[assortment?._id],
        ),
      );
      childrenRows.push(
        ...buildChildrenRows(
          assortment._id,
          translationMap?.children?.[assortment?._id],
        ),
      );
    }

    exportCSV('assortments_export', assortmentRows);
    exportAssortmentFiltersCSV(
      'assortment_filters_export',
      assortmentFiltersRows,
    );
    exportAssortmentProductsCSV(
      'assortment_product_export',
      assortmentProductRows,
    );
    exportAssortmentChildrenCSV('assortment_children_export', childrenRows);
  }, [assortments, client, exportCSV, locales]);

  return {
    exportAssortments,
    isLoading: isLoadingTranslations || isExporting,
  };
};
