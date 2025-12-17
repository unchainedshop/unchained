import { useCallback } from 'react';
import { useCSVExport } from '../../common/hooks/useCSVExport';

export const ASSORTMENT_CSV_SCHEMA = {
  base: ['_id', 'isActive', 'isRoot', 'sequence', 'tags'],
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
    'childAssortmentId',
    'tags',
    'sortKey',
  ],
};

export const buildAssortmentHeaders = (locales: string[]) => [
  ...ASSORTMENT_CSV_SCHEMA.base,
  ...locales.flatMap((locale) =>
    ASSORTMENT_CSV_SCHEMA.textFields.map((field) => `texts.${locale}.${field}`),
  ),
];

export const buildAssortmentFilterHeaders = () => [
  ...ASSORTMENT_CSV_SCHEMA.assortmentFilterFields,
];

export const buildAssortmentProductHeaders = () => [
  ...ASSORTMENT_CSV_SCHEMA.assortmentProductFields,
];

export const buildAssortmentChildrenHeaders = () => [
  ...ASSORTMENT_CSV_SCHEMA.assortmentChildrenFields,
];

export const useAssortmentExport = () => {
  const { exportCSV, isExporting } = useCSVExport((a) => a);

  const exportAssortments = useCallback(async (data) => {
    exportCSV({ type: 'ASSORTMENTS', ...data });
  }, []);

  return {
    exportAssortments,
    isLoading: isExporting,
  };
};
