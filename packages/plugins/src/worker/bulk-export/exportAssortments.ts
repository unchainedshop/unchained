import type { UnchainedCore } from '@unchainedshop/core';
import generateCSVFileAndURL from './generateCSVFileAndUrl.ts';

export interface AssortmentExportParams {
  exportAssortments?: boolean;
  exportLinks?: boolean;
  exportProducts?: boolean;
  exportFilters?: boolean;
  [key: string]: any;
}

const ASSORTMENT_CSV_SCHEMA = {
  base: ['_id', 'isActive', 'isBase', 'isRoot', 'sequence', 'tags'],
  textFields: ['title', 'subtitle', 'description', 'slug'],
  filterFields: ['_id', 'assortmentId', 'filterId', 'tags', 'sortKey'],
  productFields: ['_id', 'assortmentId', 'productId', 'tags', 'sortKey'],
  childrenFields: ['_id', 'assortmentId', 'childAssortmentId', 'tags', 'sortKey'],
};

const buildAssortmentHeaders = (locales: string[]) => [
  ...ASSORTMENT_CSV_SCHEMA.base,
  ...locales.flatMap((locale) =>
    ASSORTMENT_CSV_SCHEMA.textFields.map((field) => `texts.${locale}.${field}`),
  ),
];

const buildFilterHeaders = () => ASSORTMENT_CSV_SCHEMA.filterFields;
const buildProductHeaders = () => ASSORTMENT_CSV_SCHEMA.productFields;
const buildChildrenHeaders = () => ASSORTMENT_CSV_SCHEMA.childrenFields;

const fetchAssortmentTexts = async (modules: UnchainedCore['modules'], assortmentId: string) => {
  const texts = await modules.assortments.texts.findTexts({ assortmentId });
  return texts.reduce((acc, t) => ({ ...acc, [t.locale]: t }), {} as Record<string, any>);
};

const exportAssortmentsHandler = async (
  { exportAssortments, exportFilters, exportLinks, exportProducts, ...params }: AssortmentExportParams,
  locales: string[],
  unchainedAPI: UnchainedCore,
) => {
  const { modules } = unchainedAPI;
  const assortments = await modules.assortments.findAssortments({ ...params } as any);

  const assortmentRows: Record<string, any>[] = [];
  const filterRows: Record<string, any>[] = [];
  const productRows: Record<string, any>[] = [];
  const childrenRows: Record<string, any>[] = [];

  await Promise.all(
    assortments.map(async (assortment) => {
      if (exportAssortments) {
        const texts = await fetchAssortmentTexts(modules, assortment._id);

        const row: Record<string, any> = { ...assortment };
        locales.forEach((locale) => {
          const t = texts[locale] || {};
          ASSORTMENT_CSV_SCHEMA.textFields.forEach((field) => {
            let value = t[field];
            if (Array.isArray(value)) value = value.join(';');
            row[`texts.${locale}.${field}`] = value ?? '';
          });
        });
        assortmentRows.push(row);
      }
      if (exportFilters) {
        const assortmentFilters = await modules.assortments.filters.findFilters({
          assortmentId: assortment._id,
        });
        filterRows.push(
          ...assortmentFilters.map(({ _id, filterId, tags, sortKey }) => ({
            _id,
            assortmentId: assortment._id,
            filterId,
            tags: tags || '',
            sortKey,
          })),
        );
      }

      if (exportProducts) {
        const assortmentProducts = await modules.assortments.products.findAssortmentProducts({
          assortmentId: assortment._id,
        });
        productRows.push(
          ...assortmentProducts.map(({ _id, productId, tags, sortKey }) => ({
            _id,
            assortmentId: assortment._id,
            productId,
            tags: tags || '',
            sortKey,
          })),
        );
      }
      if (exportLinks) {
        const links = await modules.assortments.links.findLinks({ assortmentId: assortment._id });
        childrenRows.push(
          ...links
            .filter((l) => l.childAssortmentId !== assortment._id)
            .map(({ _id, childAssortmentId, tags, sortKey }) => ({
              _id,
              assortmentId: assortment._id,
              childAssortmentId,
              tags: tags || '',
              sortKey,
            })),
        );
      }
    }),
  );

  const [assortmentsCSV, filtersCSV, productsCSV, childrenCSV] = await Promise.all([
    exportAssortments
      ? generateCSVFileAndURL({
          headers: buildAssortmentHeaders(locales),
          rows: assortmentRows,
          directoryName: 'exports',
          fileName: 'assortments_export.csv',
          unchainedAPI,
        })
      : null,
    exportFilters
      ? generateCSVFileAndURL({
          headers: buildFilterHeaders(),
          rows: filterRows,
          directoryName: 'exports',
          fileName: 'assortment_filters_export.csv',
          unchainedAPI,
        })
      : null,
    exportProducts
      ? generateCSVFileAndURL({
          headers: buildProductHeaders(),
          rows: productRows,
          directoryName: 'exports',
          fileName: 'assortment_products_export.csv',
          unchainedAPI,
        })
      : null,
    exportLinks
      ? generateCSVFileAndURL({
          headers: buildChildrenHeaders(),
          rows: childrenRows,
          directoryName: 'exports',
          fileName: 'assortment_children_export.csv',
          unchainedAPI,
        })
      : null,
  ]);

  return {
    assortments: assortmentsCSV,
    filters: filtersCSV,
    products: productsCSV,
    children: childrenCSV,
  };
};

export default exportAssortmentsHandler;
