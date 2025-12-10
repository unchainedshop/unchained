import { CSVRow } from '../../common/utils/csvUtils';
import { PRODUCT_TYPES } from '../ProductTypes';

export type ProductType =
  | 'SimpleProduct'
  | 'ConfigurableProduct'
  | 'PlanProduct'
  | 'BundleProduct'
  | 'TokenizedProduct';

export interface ImportableProduct {
  _id?: string;
  status: 'DRAFT' | 'ACTIVE' | 'DELETED';
  type: ProductType;
  tags: string[];
  sequence: number;
  sku?: string;
  baseUnit?: string;
  updated?: string;
  published?: string;
  supply?: {
    weightInGram?: number;
    heightInMillimeters?: number;
    lengthInMillimeters?: number;
    widthInMillimeters?: number;
  };
  warehousing?: {
    sku?: string;
    baseUnit?: string;
  };
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
  const hasSupply =
    row['supply.weightInGram'] ||
    row['supply.heightInMillimeters'] ||
    row['supply.lengthInMillimeters'] ||
    row['supply.widthInMillimeters'];
  const hasWarehousing = row['sku'] || row['baseUnit'];
  const content = normalizeProductContent(row);
  const mapped: ImportableProduct = {
    _id: row['_id'] || undefined,
    warehousing: hasWarehousing
      ? {
          sku: row['sku'] || undefined,
          baseUnit: row['baseUnit'] || undefined,
        }
      : undefined,
    sequence: parseInt(row['sequence'] || '0', 10),
    status: row['status'] || null,
    type: row['__typename'] as ProductType,
    tags: row['tags'] ? (row['tags'] as string).split(';') : [],
    updated: row['updated'] || undefined,
    published: row['published'] || undefined,
    content,
    supply: hasSupply
      ? {
          weightInGram: row['supply.weightInGram']
            ? (parseFloat(row['supply.weightInGram'] as string) ?? undefined)
            : undefined,
          heightInMillimeters: row['supply.heightInMillimeters']
            ? (parseFloat(row['supply.heightInMillimeters'] as string) ??
              undefined)
            : undefined,
          lengthInMillimeters: row['supply.lengthInMillimeters']
            ? (parseFloat(row['supply.lengthInMillimeters'] as string) ??
              undefined)
            : undefined,
          widthInMillimeters: row['supply.widthInMillimeters']
            ? (parseFloat(row['supply.widthInMillimeters'] as string) ??
              undefined)
            : undefined,
        }
      : undefined,
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
  if (!Object.values(PRODUCT_TYPES).includes(product.type)) {
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

const buildProductEvents = (product: ImportableProduct) => {
  const now = new Date();

  return {
    entity: 'PRODUCT',
    operation: 'CREATE',
    payload: {
      _id: product._id,
      specification: {
        ...product,
        published: product.status === 'ACTIVE' ? now : null,
        status: product.status === 'ACTIVE' ? 'ACTIVE' : null,
        warehousing: {
          sku: product.sku,
          baseUnit: product.baseUnit,
        },
      },
    },
  };
};

const usePrepareProductImport = () => {
  const prepareProductImport = async (products: ImportableProduct[]) =>
    products.map((p) => buildProductEvents(p));
  return { prepareProductImport };
};

export default usePrepareProductImport;
