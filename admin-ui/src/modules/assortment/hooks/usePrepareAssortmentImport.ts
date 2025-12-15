import { CSVRow } from '../../common/utils/csvUtils';

export interface ImportableAssortment {
  _id?: string;
  isActive?: boolean;
  isBase?: boolean;
  isRoot?: boolean;
  tags: string[];
  sequence: number;
  content?: Record<string, any>;
  filters?: any[];
  children?: any[];
  products?: any[];
}

const normalizeAssortmentContent = (row: CSVRow) => {
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

export const assortmentMapper = (row: CSVRow): ImportableAssortment => {
  const content = normalizeAssortmentContent(row);
  const mapped: ImportableAssortment = {
    _id: row['_id'] || undefined,
    sequence: parseInt(row['sequence'] || '0', 10),
    isActive: row['isActive'] === 'true',
    isBase: row['isBase'] === 'true',
    isRoot: row['isRoot'] === 'true',

    tags: row['tags'] ? (row['tags'] as string).split(';') : [],
    content,
  };

  return mapped;
};

export const validateAssortment = ({ assortmentCSV }: any, intl): string[] => {
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
  return errors;
};

const buildAssortmentEvents = ({
  children,
  products,
  filters,
  ...assortment
}: ImportableAssortment) => {
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
  }: any): Promise<any> => {
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
          ({ assortmentChildId, tags, sortKey, _id }) => ({
            assortmentId: assortmentChildId,
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
