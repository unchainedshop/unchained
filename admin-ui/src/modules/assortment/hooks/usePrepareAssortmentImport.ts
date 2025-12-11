import { CSVRow } from '../../common/utils/csvUtils';

export interface ImportableAssortment {
  _id?: string;
  isActive?: boolean;
  isBase?: boolean;
  isRoot?: boolean;
  tags: string[];
  sequence: number;
  content?: Record<string, any>;
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

export const validateAssortment = (
  assortment: ImportableAssortment,
  intl,
): string[] => {
  const errors: string[] = [];
  if (!assortment.content || Object.keys(assortment.content).length === 0) {
    errors.push(
      intl.formatMessage({
        id: 'assortment_import_localized_texts_missing',
        defaultMessage: 'Title is required',
      }),
    );
  }
  return errors;
};

const buildAssortmentEvents = (assortment: ImportableAssortment) => {
  const now = new Date();

  return {
    entity: 'assortment',
    operation: 'CREATE',
    payload: {
      _id: assortment._id,
      specification: {
        ...assortment,
      },
    },
  };
};

const usePrepareAssortmentImport = () => {
  const prepareAssortmentImport = async (assortments: ImportableAssortment[]) =>
    assortments.map((p) => buildAssortmentEvents(p));

  return { prepareAssortmentImport };
};

export default usePrepareAssortmentImport;
