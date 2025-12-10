import { useApolloClient } from '@apollo/client/react';
import { CSVRow } from '../../common/utils/csvUtils';
import { fetchExistingAssortmentId } from '../utils/fetchExistingAssortmentId';

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

const buildAssortmentEvents = (
  assortment: ImportableAssortment,
  existingAssortmentIds: Set<string>,
) => {
  const exists = !!assortment._id && existingAssortmentIds.has(assortment._id);
  const now = new Date();

  return {
    entity: 'assortment',
    operation: exists ? 'UPDATE' : 'CREATE',
    payload: {
      _id: assortment._id,
      specification: {
        ...assortment,
        created: exists ? undefined : now,
        updated: exists ? now : undefined,
      },
    },
  };
};

const usePrepareAssortmentImport = () => {
  const apollo = useApolloClient();

  const prepareAssortmentImport = async (
    assortments: ImportableAssortment[],
  ) => {
    const existingIds = await Promise.all(
      assortments.map(
        ({ _id }) => _id && fetchExistingAssortmentId(_id, apollo),
      ),
    );
    const existingSet = new Set(existingIds.filter(Boolean));

    return assortments.map((p) => buildAssortmentEvents(p, existingSet));
  };

  return { prepareAssortmentImport };
};

export default usePrepareAssortmentImport;
