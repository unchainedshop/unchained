import type { UnchainedCore } from '@unchainedshop/core';
import generateCSVFileAndURL from './generateCSVFileAndUrl.ts';

export interface ProductExportParams {
  exportProducts?: boolean;
  exportBundleItems?: boolean;
  exportPrices?: boolean;
  exportVariations?: boolean;
  exportVariationOptions?: boolean;
  [key: string]: any;
}

const PRODUCT_CSV_SCHEMA = {
  base: ['_id', 'sku', 'baseUnit', 'sequence', 'status', 'tags', 'updated', 'published', 'type'],
  textFields: ['title', 'subtitle', 'description', 'vendor', 'brand', 'labels', 'slug'],
  priceFields: [
    'productId',
    'amount',
    'currencyCode',
    'countryCode',
    'isTaxable',
    'isNetPrice',
    'maxQuantity',
  ],
  bundleItemHeaders: ['productId', 'bundleItemProductId', 'quantity', 'configuration'],
  variationItemHeaders: ['productId', 'variationId', 'key', 'type'],
  variationTextFields: ['title', 'subtitle'],
  variationOptionItemHeaders: ['variationId', 'value'],
  variationOptionTextFields: ['title', 'subtitle'],
};

const buildProductHeaders = (locales: string[]) => [
  ...PRODUCT_CSV_SCHEMA.base,
  ...locales.flatMap((l) => PRODUCT_CSV_SCHEMA.textFields.map((f) => `texts.${l}.${f}`)),
  'supply.weightInGram',
  'supply.heightInMillimeters',
  'supply.lengthInMillimeters',
  'supply.widthInMillimeters',
];

const buildPriceHeaders = () => PRODUCT_CSV_SCHEMA.priceFields;
const buildBundleHeaders = () => PRODUCT_CSV_SCHEMA.bundleItemHeaders;

const buildVariationHeaders = (locales: string[]) => [
  ...PRODUCT_CSV_SCHEMA.variationItemHeaders,
  ...locales.flatMap((l) => PRODUCT_CSV_SCHEMA.variationTextFields.map((f) => `texts.${l}.${f}`)),
];

const buildVariationOptionsHeaders = (locales: string[]) => [
  ...PRODUCT_CSV_SCHEMA.variationOptionItemHeaders,
  ...locales.flatMap((l) => PRODUCT_CSV_SCHEMA.variationOptionTextFields.map((f) => `texts.${l}.${f}`)),
];

const mapTextsToRow = (row: Record<string, any>, texts: any[], locales: string[], fields: string[]) => {
  locales.forEach((locale) => {
    const t = texts.find((x) => x.locale === locale) || {};
    fields.forEach((f) => {
      row[`texts.${locale}.${f}`] = Array.isArray(t[f]) ? t[f].join(';') : (t[f] ?? '');
    });
  });
};

const buildProductRow = (product: any, locales: string[]) => {
  const row: any = {};
  PRODUCT_CSV_SCHEMA.base.forEach((k) => (row[k] = product[k] ?? ''));
  row['supply.weightInGram'] = product?.dimensions?.weight ?? '';
  row['supply.heightInMillimeters'] = product?.dimensions?.height ?? '';
  row['supply.lengthInMillimeters'] = product?.dimensions?.length ?? '';
  row['supply.widthInMillimeters'] = product?.dimensions?.width ?? '';
  mapTextsToRow(row, product.texts ?? [], locales, PRODUCT_CSV_SCHEMA.textFields);
  return row;
};

const buildPriceRows = (productId: string, prices = []) =>
  prices.map((p: any) => ({
    productId,
    amount: p.amount ?? '',
    isNetPrice: p.isNetPrice ?? '',
    isTaxable: p.isTaxable ?? '',
    currencyCode: p.currency?.isoCode ?? '',
    countryCode: p.country?.isoCode ?? '',
    maxQuantity: p.maxQuantity ?? '',
  }));

const buildBundleRows = (productId: string, bundles = []) =>
  bundles.map((b: any) => ({
    productId,
    bundleItemProductId: b.productId,
    quantity: b.quantity ?? 1,
    configuration: (b.configuration || []).map((c: any) => Object.values(c).join(':')).join(';'),
  }));

const buildVariationRows = (productId: string, variations = [], locales: string[]) => {
  const variationRows: any[] = [];
  const optionRows: any[] = [];

  variations.forEach((v: any) => {
    const row: any = {
      productId,
      variationId: v._id,
      key: v.key,
      type: v.type,
    };
    mapTextsToRow(row, Object.values(v.texts || {}), locales, PRODUCT_CSV_SCHEMA.variationTextFields);
    variationRows.push(row);

    const options = v.options?.[v._id] ?? [];
    options.forEach((o: any) => {
      const optRow: any = {
        variationId: v._id,
        value: o.productVariationOption,
      };
      mapTextsToRow(
        optRow,
        Object.values(o.texts || {}),
        locales,
        PRODUCT_CSV_SCHEMA.variationOptionTextFields,
      );
      optionRows.push(optRow);
    });
  });

  return { variationRows, optionRows };
};

const exportProductsHandler = async (
  {
    exportBundleItems,
    exportPrices,
    exportProducts,
    exportVariationOptions,
    exportVariations,
    ...params
  }: ProductExportParams,
  locales: string[],
  unchainedAPI: UnchainedCore,
) => {
  const { queryString, includeDrafts, tags } = params;
  const products = await unchainedAPI.modules.products.findProducts({
    includeDrafts,
    queryString,
    tags,
  });

  const normalized: any = { products: {}, prices: {}, bundles: {}, variations: {} };
  for await (const p of products) {
    const productId = p._id;

    const productTexts = exportProducts
      ? await unchainedAPI.modules.products.texts.findTexts({ productId })
      : null;

    const variations = exportVariations
      ? await unchainedAPI.modules.products.variations.findProductVariations({ productId })
      : [];

    let normalizedVariations: any[] = [];
    if (exportVariations) {
      normalizedVariations = [];

      for await (const v of variations) {
        const variationTexts = exportVariations
          ? await unchainedAPI.modules.products.variations.texts.findVariationTexts({
            productVariationId: v._id,
            productVariationOptionValue: null,
          })
          : [];

        let options: any[] = [];

        if (exportVariationOptions) {
          for await (const o of v.options || []) {
            const optionTexts =
              await unchainedAPI.modules.products.variations.texts.findVariationTexts({
                productVariationId: v._id,
                productVariationOptionValue: o,
              });

            options.push({
              _id: `${v._id}:${o}`,
              productVariationOption: o,
              texts: Object.fromEntries(optionTexts.map((t: any) => [t.locale, t])),
            });
          }
        }

        normalizedVariations.push({
          ...v,
          texts: exportVariations
            ? Object.fromEntries(variationTexts.map((t: any) => [t.locale, t]))
            : {},
          options: exportVariationOptions ? { [v._id]: options } : {},
        });
      }
    }


    normalized.products[productId] = exportProducts ? { ...p, texts: productTexts } : p;
    normalized.prices[productId] = exportPrices ? (p.commerce?.pricing ?? []) : [];
    normalized.bundles[productId] = exportBundleItems ? (p.bundleItems ?? []) : [];
    normalized.variations[productId] = normalizedVariations;
  };

  const productRows: any[] = [];
  const priceRows: any[] = [];
  const bundleRows: any[] = [];
  const variationRows: any[] = [];
  const variationOptionRows: any[] = [];

  for (const pid in normalized.products) {
    if (exportProducts) {
      productRows.push(buildProductRow(normalized.products[pid], locales));
    }
    if (exportPrices) {
      priceRows.push(...buildPriceRows(pid, normalized.prices[pid]));
    }
    if (exportBundleItems) {
      bundleRows.push(...buildBundleRows(pid, normalized.bundles[pid]));
    }
    const { variationRows: vr, optionRows: or } = buildVariationRows(
      pid,
      normalized.variations[pid],
      locales,
    );
    variationRows.push(...vr);
    variationOptionRows.push(...or);
  }
  const productsCSV = exportProducts
    ? await generateCSVFileAndURL({
      headers: buildProductHeaders(locales),
      rows: productRows,
      directoryName: 'exports',
      fileName: 'products_export.csv',
      unchainedAPI,
    })
    : null;
  const pricesCSV = await exportPrices
    ? generateCSVFileAndURL({
      headers: buildPriceHeaders(),
      rows: priceRows,
      directoryName: 'exports',
      fileName: 'products_prices_export.csv',
      unchainedAPI,
    })
    : null;
  const bundlesCSV = exportBundleItems ? await generateCSVFileAndURL({
    headers: buildBundleHeaders(),
    rows: bundleRows,
    directoryName: 'exports',
    fileName: 'products_bundle_items_export.csv',
    unchainedAPI,
  })
    : null;
  const variationsCSV = exportVariations
    ? await generateCSVFileAndURL({
      headers: buildVariationHeaders(locales),
      rows: variationRows,
      directoryName: 'exports',
      fileName: 'products_variations_export.csv',
      unchainedAPI,
    })
    : null;
  const variationOptionsCSV = exportVariationOptions
    ? await generateCSVFileAndURL({
      headers: buildVariationOptionsHeaders(locales),
      rows: variationOptionRows,
      directoryName: 'exports',
      fileName: 'products_variation_option_export.csv',
      unchainedAPI,
    })
    : null;

  return {
    products: productsCSV,
    prices: pricesCSV,
    bundles: bundlesCSV,
    variations: variationsCSV,
    variationOptions: variationOptionsCSV,
  };
};

export default exportProductsHandler;
