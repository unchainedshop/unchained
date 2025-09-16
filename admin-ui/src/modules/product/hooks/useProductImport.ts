import useApp from '../../common/hooks/useApp';
import { CSVRow } from '../../common/utils/csvUtils';
import useCreateProduct from './useCreateProduct';
import useUpdateProduct from './useUpdateProduct';
import useUpdateProductTexts from './useUpdateProductTexts';

interface ImportableProduct {
  _id?: string;
  locale?: string;
  title: string;
  slug?: string;
  status: 'DRAFT' | 'ACTIVE' | 'DELETED';
  type:
    | 'SimpleProduct'
    | 'ConfigurableProduct'
    | 'PlanProduct'
    | 'BundleProduct';
  tags: string[];
  sequence: number;
  description?: string;
  vendor?: string;
  brand?: string;
  labels: string[];
}

export const productMapper = (row: CSVRow) => ({
  _id: row['ID'] || undefined,
  locale: row['Locale'],
  title: row['Title'],
  slug: row['Slug'],
  status: row['Status'],
  type: row['Type'] || 'SimpleProduct',
  tags: row['Tags'] ? row['Tags'].split(';') : [],
  sequence: row['Sequence'] ? parseInt(row['Sequence'], 10) : 0,
  description: row['Description'],
  vendor: row['Vendor'],
  brand: row['Brand'],
  labels: row['Labels'] ? row['Labels'].split(';') : [],
});

export const validateProduct = (product: any, intl): string[] => {
  const errors: string[] = [];

  if (!product.title)
    errors.push(
      intl.formatMessage({
        id: 'product_import.validation.title_required',
        defaultMessage: 'Title is required',
      }),
    );
  if (!product.type)
    errors.push(
      intl.formatMessage(
        {
          id: 'product_import.validation.invalid_type',
          defaultMessage: 'Invalid product type: {type}',
        },
        { type: product.type },
      ),
    );

  if (
    ![
      'SimpleProduct',
      'ConfigurableProduct',
      'PlanProduct',
      'BundleProduct',
    ].includes(product.type)
  ) {
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

const useProductImport = () => {
  const { createProduct } = useCreateProduct();
  const { updateProduct } = useUpdateProduct();
  const { updateProductTexts } = useUpdateProductTexts();
  const { selectedLocale } = useApp();

  const buildText = (product: any, locale: string) => ({
    locale,
    title: product.title,
    slug: product.slug || product.title.toLowerCase().replace(/\s+/g, '-'),
    description: product.description,
    vendor: product.vendor,
    brand: product.brand,
    labels: product.labels,
  });

  const create = async (product: any, locale: string): Promise<'created'> => {
    await createProduct({
      product: {
        type: product.type,
        tags: product.tags,
      },
      texts: [buildText(product, locale)],
    });

    return 'created';
  };

  const importProduct = async (
    product: ImportableProduct,
  ): Promise<'created' | 'updated'> => {
    const normalizedLocale = product?.locale || selectedLocale;
    const isUpdate = !!(product?._id || product?.slug);

    try {
      if (isUpdate) {
        const { error } = await updateProduct({
          productId: product._id,
          product: {
            sequence: product.sequence,
            tags: product.tags,
          },
        });

        if (error) {
          const code: string = (error.message || 'unknown error') as string;
          if (code === 'ProductNotFoundError') {
            return await create(product, normalizedLocale);
          }
          throw new Error(code);
        }

        await updateProductTexts({
          productId: product._id,
          texts: [buildText(product, normalizedLocale)],
        });
        return 'updated';
      } else {
        return await create(product, normalizedLocale);
      }
    } catch (e) {
      if (e.message === 'ProductNotFoundError') {
        return await create(product, normalizedLocale);
      } else {
        throw e;
      }
    }
  };

  return { importProduct };
};

export default useProductImport;
