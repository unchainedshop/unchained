import { useCallback } from 'react';
import Button from '../../common/components/Button';
import { useIntl } from 'react-intl';
import { useProductExport } from '../hooks/useProductExport';
import useProductsCount from '../hooks/useProductsCount';
import useModal from '../../modal/hooks/useModal';
import ExportOptionsForm from '../../common/components/ExportOptionsForm';

const ProductExport = ({ queryString, includeDrafts, tags }) => {
  const { setModal } = useModal();
  const { productsCount, loading } = useProductsCount({
    queryString,
    includeDrafts,
    tags,
  });
  const { exportProducts, isLoading } = useProductExport();
  const { formatMessage } = useIntl();
  const PRODUCT_EXPORT_OPTIONS = [
    {
      key: 'exportProducts',
      label: formatMessage({ id: 'products', defaultMessage: 'Products' }),
    },
    {
      key: 'exportPrices',
      label: formatMessage({ id: 'prices', defaultMessage: 'Prices' }),
    },
    {
      key: 'exportBundleItems',
      label: formatMessage({
        id: 'bundle_items',
        defaultMessage: 'Bundle items',
      }),
    },
    {
      key: 'exportVariations',
      label: formatMessage({ id: 'variations', defaultMessage: 'Variations' }),
    },
    {
      key: 'exportVariationOptions',
      label: formatMessage({
        id: 'variation_options',
        defaultMessage: 'Variation options',
      }),
    },
  ];
  const handleSubmit = useCallback(
    async (data) => {
      exportProducts({ queryString, includeDrafts, tags, ...data });
      setModal(null);
    },
    [queryString, includeDrafts, tags],
  );
  if (loading) return null;

  return (
    <Button
      onClick={async () => {
        setModal(
          <ExportOptionsForm
            options={PRODUCT_EXPORT_OPTIONS}
            onSubmit={handleSubmit}
          />,
        );
      }}
      disabled={isLoading || !productsCount}
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
