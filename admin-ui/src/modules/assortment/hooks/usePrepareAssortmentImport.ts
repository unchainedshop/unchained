import {
  AssortmentCSVRow,
  AssortmentImportPayload,
  BuildAssortmentEventsParam,
} from '../types';

const normalizeAssortmentContent = (row: AssortmentCSVRow) => {
  const content: Record<string, any> = {};
  const textPrefix = 'texts.';

  Object.entries(row).forEach(([key, value]) => {
    if (!key.startsWith(textPrefix)) return;
    const [, locale, field] = key.split('.');
    content[locale] ||= {};
    content[locale][field] = value || '';
  });

  return content;
};

export const assortmentMapper = (row: AssortmentCSVRow): AssortmentCSVRow => {
  const content = normalizeAssortmentContent(row);
  return {
    _id: row['_id'] || undefined,
    sequence:
      typeof row['sequence'] === 'string'
        ? parseInt(row['sequence'] || '0', 10)
        : row['sequence'] || 0,
    isActive: row['isActive'] === 'true',
    isRoot: row['isRoot'] === 'true',
    tags: row['tags'] ? (row['tags'] as string).split(';') : ([] as any),
    content,
  };
};

export const validateAssortment = (
  {
    assortmentCSV,
    assortmentChildrenCSV,
    assortmentFiltersCSV,
    assortmentProductsCSV,
  }: AssortmentImportPayload,
  intl,
): string[] => {
  const errors: string[] = [];
  for (const assortment of assortmentCSV) {
    const normalized = normalizeAssortmentContent(assortment);
    if (!normalized || !Object.values(normalized).some((v) => v.title)) {
      errors.push(
        intl.formatMessage({
          id: 'assortment_import_localized_texts_missing',
          defaultMessage: 'Title is required',
        }),
      );
    }
  }

  for (const assortmentLink of assortmentChildrenCSV) {
    if (!assortmentLink.assortmentId) {
      errors.push(
        intl.formatMessage({
          id: 'assortment_children_CSV_import_assortment_id_missing',
          defaultMessage: 'Child csv record missing assortmentId',
        }),
      );
    }
    if (!assortmentLink.childAssortmentId) {
      errors.push(
        intl.formatMessage({
          id: 'assortment_children_CSV_import_child_id_missing',
          defaultMessage: 'Child csv record missing childAssortmentId',
        }),
      );
    }
  }

  for (const assortmentFilter of assortmentFiltersCSV) {
    if (!assortmentFilter.assortmentId) {
      errors.push(
        intl.formatMessage({
          id: 'assortment_filter_CSV_import_assortment_id_missing',
          defaultMessage: 'Assortment filter csv record missing assortmentId',
        }),
      );
    }
    if (!assortmentFilter.filterId) {
      errors.push(
        intl.formatMessage({
          id: 'assortment_filter_CSV_import_filter_id_missing',
          defaultMessage: 'Assortment filter csv record missing filterId',
        }),
      );
    }
  }

  for (const assortmentProduct of assortmentProductsCSV) {
    if (!assortmentProduct.assortmentId) {
      errors.push(
        intl.formatMessage({
          id: 'assortment_product_CSV_import_assortment_id_missing',
          defaultMessage: 'Product csv record missing assortmentId',
        }),
      );
    }
    if (!assortmentProduct.productId) {
      errors.push(
        intl.formatMessage({
          id: 'assortment_product_CSV_import_product_id_missing',
          defaultMessage: 'Product csv record missing productId',
        }),
      );
    }
  }
  return errors;
};

const buildAssortmentEvents = ({
  children,
  products,
  filters,
  ...assortment
}: BuildAssortmentEventsParam) => {
  return {
    entity: 'assortment',
    operation: 'CREATE',
    payload: {
      _id: assortment._id,
      specification: {
        ...assortment,
      },
      products,
      filters,
      children,
    },
  };
};

const usePrepareAssortmentImport = () => {
  const prepareAssortmentImport = async ({
    assortmentCSV,
    assortmentProductsCSV,
    assortmentChildrenCSV,
    assortmentFiltersCSV,
  }: AssortmentImportPayload) => {
    return assortmentCSV.map((assortment) => {
      const assortmentProducts = (assortmentProductsCSV || [])?.filter(
        (p) => p.assortmentId === assortment._id,
      );
      const assortmentLinks = (assortmentChildrenCSV || [])?.filter(
        (l) => l.assortmentId === assortment._id,
      );
      const assortmentFilters = (assortmentFiltersCSV || [])?.filter(
        (f) => f.assortmentId === assortment._id,
      );

      let children = undefined;
      let filters = undefined;
      let products = undefined;

      if (assortmentProducts.length) {
        products = assortmentProducts.map(
          ({ productId, tags, sortKey, _id }) => ({
            productId,
            tags: tags ? (tags as string).split(';') : [],
            sortKey: sortKey ? Number(sortKey) : undefined,
            _id,
          }),
        );
      }

      if (assortmentLinks.length) {
        children = assortmentLinks.map(
          ({ childAssortmentId, tags, sortKey, _id }) => ({
            assortmentId: childAssortmentId,
            tags: tags ? (tags as string).split(';') : [],
            sortKey: sortKey ? Number(sortKey) : undefined,
            _id,
          }),
        );
      }

      if (assortmentFilters.length) {
        filters = assortmentFilters.map(({ filterId, tags, sortKey, _id }) => ({
          filterId,
          tags: tags ? (tags as string).split(';') : [],
          sortKey: sortKey ? Number(sortKey) : undefined,
          _id,
        }));
      }

      return buildAssortmentEvents({
        ...assortmentMapper(assortment),
        filters,
        products,
        children,
      });
    });
  };
  return { prepareAssortmentImport };
};

export default usePrepareAssortmentImport;
