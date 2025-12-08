import { useApolloClient } from '@apollo/client/react';
import { CSVRow } from '../../common/utils/csvUtils';
import { fetchExistingProductId } from '../utils/fetchExistingProductId';

export type ProductType =
  | 'SimpleProduct'
  | 'ConfigurableProduct'
  | 'PlanProduct'
  | 'BundleProduct'
  | 'TokenizedProduct';

export interface ImportableProduct {
  _id?: string;
  locale?: string;
  title: string;
  slug?: string;
  status: 'DRAFT' | 'ACTIVE' | 'DELETED';
  type: ProductType;
  tags: string[];
  sequence: number;
  description?: string;
  vendor?: string;
  brand?: string;
  labels: string[];
  sku?: string;
  updated?: string;
  published?: string;
  content?: Record<string, any>;
}

const normalizeProductContent = (row: CSVRow) => {
  const content: Record<string, any> = {};
  const textPrefix = 'texts.';

  Object.entries(row).forEach(([key, value]) => {
    if (!key.startsWith(textPrefix)) return;
    const [, locale, field] = key.split('.');
    content[locale] ||= {};
    if (field === 'labels') {
      content[locale][field] = value ? (value as string).split(';') : [];
    } else {
      content[locale][field] = value || '';
    }
  });

  return content;
};

export const productMapper = (row: CSVRow): ImportableProduct => {
  const content = normalizeProductContent(row);
  const defaultLocale = Object.keys(content)[0] || '';
  const mapped: ImportableProduct = {
    _id: row['_id'] || undefined,
    sku: row['sku'] || undefined,
    sequence: parseInt(row['sequence'] || '0', 10),
    status: row['status'] || 'DRAFT',
    type: row['__typename'] as ProductType,
    tags: row['tags'] ? (row['tags'] as string).split(';') : [],
    updated: row['updated'] || undefined,
    published: row['published'] || undefined,
    content,
    title: defaultLocale ? content[defaultLocale].title || '' : '',
    description: defaultLocale ? content[defaultLocale].description || '' : '',
    labels: defaultLocale ? content[defaultLocale].labels || [] : [],
  };

  return mapped;
};

export const validateProduct = (product: ImportableProduct, intl): string[] => {
  const errors: string[] = [];
  if (!product.content || Object.keys(product.content).length === 0) {
    errors.push(
      intl.formatMessage({
        id: 'product_import_localized_texts_missing',
        defaultMessage: 'Title is required',
      }),
    );
  }

  const validTypes: ProductType[] = [
    'SimpleProduct',
    'ConfigurableProduct',
    'PlanProduct',
    'BundleProduct',
    'TokenizedProduct',
  ];

  if (!validTypes.includes(product.type)) {
    errors.push(
      intl.formatMessage(
        {
          id: 'product_import.validation.invalid_type',
          defaultMessage: 'Invalid product type: {type}',
        },
        { type: product.type },
      ),
    );
  }

  return errors;
};

const buildProductEvents = (
  product: ImportableProduct,
  existingProductIds: Set<string>,
) => {
  const exists = !!product._id && existingProductIds.has(product._id);
  const now = new Date();

  return {
    entity: 'PRODUCT',
    operation: exists ? 'UPDATE' : 'CREATE',
    payload: {
      _id: product._id,
      specification: {
        ...product,
        created: exists ? undefined : now,
        updated: exists ? now : undefined,
        published: product.status === 'ACTIVE' ? now : null,
        status: product.status === 'ACTIVE' ? 'ACTIVE' : null,
        warehousing: {
          sku: product.sku,
        },
      },
    },
  };
};

const usePrepareProductImport = () => {
  const apollo = useApolloClient();

  const prepareProductImport = async (products: ImportableProduct[]) => {
    const existingIds = await Promise.all(
      products.map(({ _id }) => _id && fetchExistingProductId(_id, apollo)),
    );
    const existingSet = new Set(existingIds.filter(Boolean));

    return products.map((p) => buildProductEvents(p, existingSet));
  };

  return { prepareProductImport };
};

export default usePrepareProductImport;
