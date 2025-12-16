import type { UnchainedCore } from '@unchainedshop/core';
import generateCSVFileAndURL from './generateCSVFileAndUrl.ts';

const PRODUCT_CSV_SCHEMA = {
  base: ['_id', 'sku', 'baseUnit', 'sequence', 'status', 'tags', 'updated', 'published', '__typename'],
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

const buildProductRow = (product: any, locales: string[]) => {
  const row: any = {};

  PRODUCT_CSV_SCHEMA.base.forEach((k) => {
    row[k] = product[k] ?? '';
  });

  row['supply.weightInGram'] = product?.dimensions?.weight ?? '';
  row['supply.heightInMillimeters'] = product?.dimensions?.height ?? '';
  row['supply.lengthInMillimeters'] = product?.dimensions?.length ?? '';
  row['supply.widthInMillimeters'] = product?.dimensions?.width ?? '';

  locales.forEach((locale) => {
    const text = product.texts?.find((t) => t.locale === locale) ?? {};
    PRODUCT_CSV_SCHEMA.textFields.forEach((f) => {
      row[`texts.${locale}.${f}`] = Array.isArray(text[f]) ? text[f].join(';') : (text[f] ?? '');
    });
  });

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
    bundleItemProductId: b.product?._id,
    quantity: b.quantity ?? 1,
    configuration: (b.configuration || []).map((c: any) => Object.values(c).join(':')).join(';'),
  }));

const buildVariationRows = (productId: string, variations = [], locales: string[]) => {
  const variationRows: any[] = [];
  const optionRows: any[] = [];

  for (const v of variations as any[]) {
    const row: any = {
      productId,
      variationId: v._id,
      key: v.key,
      type: v.type,
    };

    locales.forEach((l) => {
      const texts = v.texts?.[l] ?? {};
      PRODUCT_CSV_SCHEMA.variationTextFields.forEach((f) => {
        row[`texts.${l}.${f}`] = texts[f] ?? '';
      });
    });

    variationRows.push(row);

    const options = v.options?.[v._id] ?? [];
    for (const o of options) {
      const optRow: any = {
        variationId: v._id,
        value: o.productVariationOption,
      };

      locales.forEach((l) => {
        const texts = o.texts?.[l] ?? {};
        PRODUCT_CSV_SCHEMA.variationOptionTextFields.forEach((f) => {
          optRow[`texts.${l}.${f}`] = texts[f] ?? '';
        });
      });

      optionRows.push(optRow);
    }
  }

  return { variationRows, optionRows };
};

const exportProducts = async (params, unchainedAPI: UnchainedCore) => {
  const { queryString, includeDrafts, tags } = params;

  const products = await unchainedAPI.modules.products.findProducts({
    includeDrafts,
    queryString,
    tags,
  });

  const normalized: any = {
    products: {},
    prices: {},
    bundles: {},
    variations: {},
  };

  for await (const p of products) {
    const [texts, variations] = await Promise.all([
      unchainedAPI.modules.products.texts.findTexts({
        productId: p._id,
      }),
      unchainedAPI.modules.products.variations.findProductVariations({ productId: p._id }),
    ]);

    const normalizedVariations = await Promise.all(
      variations.map(async (v: any) => {
        const variationTexts = await unchainedAPI.modules.products.variations.texts.findVariationTexts({
          productVariationId: v._id,
          productVariationOptionValue: null,
        });

        const options = await Promise.all(
          v.options.map(async (o: any) => {
            const optionTexts = await unchainedAPI.modules.products.variations.texts.findVariationTexts({
              productVariationId: v._id,
              productVariationOptionValue: o,
            });

            return {
              _id: `${v._id}:${o}`,
              productVariationOption: o,
              texts: Object.fromEntries(optionTexts.map((t: any) => [t.locale, t])),
            };
          }),
        );

        return {
          ...v,
          texts: Object.fromEntries(variationTexts.map((t: any) => [t.locale, t])),
          options: { [v._id]: options },
        };
      }),
    );

    normalized.products[p._id] = { ...p, texts };
    normalized.prices[p._id] = p.commerce?.pricing ?? [];
    normalized.bundles[p._id] = p.bundleItems ?? [];
    normalized.variations[p._id] = normalizedVariations;
  }

  const locales = Array.from(
    new Set(
      Object.values(normalized.products).flatMap((p: any) => p.texts?.map((t: any) => t.locale) ?? []),
    ),
  );

  const productRows: any[] = [];
  const priceRows: any[] = [];
  const bundleRows: any[] = [];
  const variationRows: any[] = [];
  const variationOptionRows: any[] = [];

  for (const pid in normalized.products) {
    productRows.push(buildProductRow(normalized.products[pid], locales));
    priceRows.push(...buildPriceRows(pid, normalized.prices[pid]));
    bundleRows.push(...buildBundleRows(pid, normalized.bundles[pid]));

    const { variationRows: vr, optionRows: or } = buildVariationRows(
      pid,
      normalized.variations[pid],
      locales,
    );

    variationRows.push(...vr);
    variationOptionRows.push(...or);
  }

  return {
    products: await generateCSVFileAndURL({
      headers: buildProductHeaders(locales),
      rows: productRows,
      directoryName: 'exports',
      fileName: 'products_export.csv',
      unchainedAPI,
    }),
    prices: await generateCSVFileAndURL({
      headers: buildPriceHeaders(),
      rows: priceRows,
      directoryName: 'exports',
      fileName: 'products_prices_export.csv',
      unchainedAPI,
    }),
    bundles: await generateCSVFileAndURL({
      headers: buildBundleHeaders(),
      rows: bundleRows,
      directoryName: 'exports',
      fileName: 'products_bundle_items_export.csv',
      unchainedAPI,
    }),
    variations: await generateCSVFileAndURL({
      headers: buildVariationHeaders(locales),
      rows: variationRows,
      directoryName: 'exports',
      fileName: 'products_variations_export.csv',
      unchainedAPI,
    }),
    variationOptions: await generateCSVFileAndURL({
      headers: buildVariationOptionsHeaders(locales),
      rows: variationOptionRows,
      directoryName: 'exports',
      fileName: 'products_variation_option_export.csv',
      unchainedAPI,
    }),
  };
};

export default exportProducts;
