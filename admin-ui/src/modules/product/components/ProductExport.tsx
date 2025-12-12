import React from 'react';
import Button from '../../common/components/Button';
import { useIntl } from 'react-intl';
import useProducts from '../hooks/useProducts';
import { useProductExport } from '../hooks/useProductExport';

const ProductExport = ({ queryString, includeDrafts, tags, sort }) => {
  const { products, loading, client } = useProducts({
    limit: 0,
    queryString,
    includeDrafts,
    tags,
    sort,
  });

  const { exportProducts, isLoading } = useProductExport(products, client);
  const { formatMessage } = useIntl();

  if (loading) return null;

  return (
    <Button
      onClick={exportProducts}
      disabled={isLoading || !products.length}
      variant="secondary"
      text={
        isLoading
          ? formatMessage({ id: 'exporting', defaultMessage: 'Exporting...' })
          : formatMessage({ id: 'export', defaultMessage: 'Export' })
      }
    />
  );
};

export default ProductExport;
