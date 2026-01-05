import { useCallback } from 'react';
import Button from '../../common/components/Button';
import { useIntl } from 'react-intl';
import { useProductExport } from '../hooks/useProductExport';
import useProductsCount from '../hooks/useProductsCount';
import useModal from '../../modal/hooks/useModal';
import ExportOptionsForm, {
  ExportOption,
} from '../../common/components/ExportOptionsForm';

interface ProductExportProps {
  queryString?: string;
  includeDrafts?: boolean;
  tags?: string[];
}

const ProductExport = ({
  queryString,
  includeDrafts,
  tags,
}: ProductExportProps) => {
  const { setModal } = useModal();
  const { productsCount, loading } = useProductsCount({
    queryString,
    includeDrafts,
    tags,
  });
  const { exportProducts, isExporting } = useProductExport();
  const { formatMessage } = useIntl();

  const EXPORT_OPTIONS: ExportOption[] = [
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
    async (data: Record<string, boolean>) => {
      await exportProducts({ queryString, includeDrafts, tags, ...data });
      setModal(null);
    },
    [queryString, includeDrafts, tags, exportProducts, setModal],
  );

  if (loading) return null;

  return (
    <Button
      onClick={() => {
        setModal(
          <ExportOptionsForm
            options={EXPORT_OPTIONS}
            onSubmit={handleSubmit}
            loading={isExporting}
          />,
        );
      }}
      disabled={isExporting || !productsCount}
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
