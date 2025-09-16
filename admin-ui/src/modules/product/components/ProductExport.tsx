import React from 'react';
import { useIntl } from 'react-intl';
import Button from '../../common/components/Button';
import useProducts from '../hooks/useProducts';
import useAuth from '../../Auth/useAuth';
import { useCSVExport } from '../../common/hooks/useCSVExport';
import { IProduct } from '../../../gql/types';

const CSV_HEADERS = [
  'ID',
  'Locale',
  'Title',
  'Slug',
  'Status',
  'Type',
  'Tags',
  'Sequence',
  'Price',
  'Currency',
  'Description',
  'Vendor',
  'Brand',
  'Labels',
  'Created',
  'Updated',
  'Published',
];
interface Product extends IProduct {
  type: string;
  __typename: string;
  catalogPrice: any;
}
const extractProductRow = (product: Product) => ({
  ID: product._id,
  Locale: product.texts?.locale || '',
  Title: product.texts?.title || '',
  Slug: product.texts?.slug || '',
  Status: product.status,
  Type: product.__typename || product.type || 'SimpleProduct',
  Tags: product.tags?.join(';') || '',
  Sequence: product.sequence || '',
  Price: product.catalogPrice?.amount || '',
  Currency: product.catalogPrice?.currencyCode || '',
  Description: product.texts?.description || '',
  Vendor: product.texts?.vendor || '',
  Brand: product.texts?.brand || '',
  Labels: product.texts?.labels?.join(';') || '',
  Created: product.created || '',
  Updated: product.updated || '',
  Published: product.published || '',
});

const ProductExport = () => {
  const { formatMessage } = useIntl();
  const { hasRole } = useAuth();
  const { products: allProducts, loading } = useProducts({
    limit: 10000,
    offset: 0,
    includeDrafts: true,
  });

  const { isExporting, exportCSV } = useCSVExport<Product>(
    allProducts as Product[],
    extractProductRow,
    {
      headers: CSV_HEADERS,
    },
  );

  if (!hasRole('showProduct')) return null;

  return (
    <Button
      onClick={() => exportCSV('products_export')}
      disabled={isExporting || loading || !allProducts?.length}
      variant="secondary"
      text={
        isExporting
          ? formatMessage({ id: 'exporting', defaultMessage: 'Exporting...' })
          : formatMessage({ id: 'export', defaultMessage: 'Export' })
      }
    />
  );
};

export default ProductExport;
