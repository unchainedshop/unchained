import React, { useRef, useState } from 'react';
import Button from '../../common/components/Button';
import parseCSV from 'papaparse';
import { useIntl } from 'react-intl';
import { CSVRow } from '../../common/utils/csvUtils';
import { productMapper } from '../hooks/usePrepareProductImport';

const ProductImportForm = ({ onImport }) => {
  const productsFileRef = useRef<HTMLInputElement>(null);
  const pricesFileRef = useRef<HTMLInputElement>(null);
  const [productsCSV, setProductsCSV] = useState<CSVRow[]>([]);
  const [pricesCSV, setPricesCSV] = useState<CSVRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const { formatMessage } = useIntl();

  const parseFile = async (file: File) => {
    const text = await file.text();
    const result = parseCSV.parse(text, { header: true, skipEmptyLines: true });
    return result.data as CSVRow[];
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setData: React.Dispatch<React.SetStateAction<CSVRow[]>>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await parseFile(file);
    setData(data);
    e.target.value = '';
  };

  const normalizeProducts = () => {
    const productMap: Record<string, any> = {};
    productsCSV.forEach((product) => {
      productMap[product._id!] = productMapper(product);
      const prices = pricesCSV.filter(
        (option) => option['productId'] === product._id,
      );
      if (prices.length)
        productMap[product._id!].commerce = {
          pricing: prices.map(
            ({ amount, maxQuantity, isNetPrice, isTaxable, ...restPrice }) => ({
              amount: parseInt(amount) ?? 0,
              isNetPrice: isNetPrice === 'true',
              isTaxable: isTaxable === 'true',
              maxQuantity: maxQuantity || 0,
              ...restPrice,
            }),
          ),
        };
    });
    return Object.values(productMap);
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const normalized = normalizeProducts();
      await onImport(normalized);
    } catch (err: any) {
      console.error('Error importing products:', err);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 border border-gray-200 rounded-lg flex flex-col gap-4">
      <h3 className="text-center text-lg font-semibold">
        {formatMessage({
          id: 'products_import_title',
          defaultMessage: 'Import Products',
        })}
      </h3>
      <p className="text-center text-sm text-gray-600">
        {formatMessage({
          id: 'product_import_description',
          defaultMessage:
            'Select your products CSV and optional Product prices CSV, then click Import.',
        })}
      </p>

      <input
        ref={productsFileRef}
        type="file"
        accept=".csv"
        onChange={(e) => handleFileChange(e, setProductsCSV)}
        className="hidden"
      />
      <input
        ref={pricesFileRef}
        type="file"
        accept=".csv"
        onChange={(e) => handleFileChange(e, setPricesCSV)}
        className="hidden"
      />

      <Button
        text={
          productsCSV.length
            ? formatMessage({
                id: 'products_file_selected',
                defaultMessage: 'Products CSV Selected',
              })
            : formatMessage({
                id: 'select_products_csv',
                defaultMessage: 'Select Products CSV',
              })
        }
        onClick={() => productsFileRef.current?.click()}
        variant="secondary"
        disabled={isImporting}
        className="w-full"
      />

      <Button
        text={
          pricesCSV.length
            ? formatMessage({
                id: 'prices_file_selected',
                defaultMessage: 'Prices CSV Selected',
              })
            : formatMessage({
                id: 'select_prices_csv',
                defaultMessage: 'Select Product prices CSV (Optional)',
              })
        }
        onClick={() => pricesFileRef.current?.click()}
        variant="secondary"
        disabled={isImporting || !productsCSV.length}
        className="w-full"
      />

      <Button
        text={
          isImporting
            ? formatMessage({ id: 'importing', defaultMessage: 'Importing...' })
            : formatMessage({ id: 'import', defaultMessage: 'Import' })
        }
        onClick={handleImport}
        disabled={isImporting || !productsCSV.length}
        variant="primary"
        className="w-full"
      />

      {productsCSV.length > 0 && (
        <p className="text-center text-xs text-gray-500">
          {formatMessage(
            {
              id: 'ready_to_import',
              defaultMessage: 'Ready to import {products} products{prices}.',
            },
            {
              products: productsCSV.length,
              prices: pricesCSV.length
                ? ` with ${pricesCSV.length} prices`
                : '',
            },
          )}
        </p>
      )}
    </div>
  );
};

export default ProductImportForm;
