import { IProductStatus, IProductVariationType } from '../../../gql/types';
import { CSVRow } from '../../common/utils/csvUtils';
import { PRODUCT_TYPES } from '../ProductTypes';
import {
  BuildProductEventsParam,
  ProductCSVRow,
  ProductImportPayload,
} from '../types';

const normalizeContent = (row: CSVRow) => {
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

export const productMapper = (row: ProductCSVRow): ProductCSVRow => {
  const hasSupply =
    row['supply.weightInGram'] ||
    row['supply.heightInMillimeters'] ||
    row['supply.lengthInMillimeters'] ||
    row['supply.widthInMillimeters'];
  const hasWarehousing = row['sku'] || row['baseUnit'];
  const content = normalizeContent(row);
  const mapped = {
    _id: row['_id'] || undefined,
    warehousing: hasWarehousing
      ? {
        sku: row['sku'] || undefined,
        baseUnit: row['baseUnit'] || undefined,
      }
      : undefined,
    sequence:
      typeof row['sequence'] === 'string'
        ? parseInt(row['sequence'] || '0', 10)
        : row['sequence'] || 0,
    status: row['status'] || null,
    type: row['type'],
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
    meta: row['meta'] ? JSON.parse(row['meta'] || '{}') : undefined
  };

  return mapped;
};

export const validateProduct = (
  {
    productsCSV,
    pricesCSV,
    bundleItemsCSV,
    variationOptionsCSV,
    variationsCSV,
  }: ProductImportPayload,
  intl,
): string[] => {
  const errors: string[] = [];
  for (const product of productsCSV) {
    if (!Object.values(PRODUCT_TYPES).includes(product?.__typename)) {
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
    if (!product.sequence) {
      errors.push(
        intl.formatMessage({
          id: 'product_import_sequence_required',
          defaultMessage: 'Required field sequence missing',
        }),
      );
    }
    if (!product.status) {
      errors.push(
        intl.formatMessage({
          id: 'product_import_status_required',
          defaultMessage: 'Required field status missing',
        }),
      );
    }
    if (
      product.status &&
      ![
        IProductStatus.Active,
        IProductStatus.Draft,
        IProductStatus.Deleted,
      ].includes(product.status)
    ) {
      errors.push(
        intl.formatMessage(
          {
            id: 'product_import_status_invalid',
            defaultMessage: 'Invalid status value given {{}}',
          },
          { status: product.status },
        ),
      );
    }
  }

  for (const price of pricesCSV) {
    if (!price.productId) {
      errors.push(
        intl.formatMessage({
          id: 'product_price_import_product_id_required',
          defaultMessage: 'Required field productId missing',
        }),
      );
    }
    if (!price.amount) {
      errors.push(
        intl.formatMessage({
          id: 'product_price_import_amount_required',
          defaultMessage: 'Required field amount missing',
        }),
      );
    }
    if (!price.countryCode) {
      errors.push(
        intl.formatMessage({
          id: 'product_price_import_countryCode_required',
          defaultMessage: 'Required field countryCode missing',
        }),
      );
    }
    if (!price.currencyCode) {
      errors.push(
        intl.formatMessage({
          id: 'product_price_import_currencyCode_required',
          defaultMessage: 'Required field currencyCode missing',
        }),
      );
    }
  }

  for (const price of bundleItemsCSV) {
    if (!price.productId) {
      errors.push(
        intl.formatMessage({
          id: 'product_bundle_import_product_id_required',
          defaultMessage: 'Required field variation productId missing',
        }),
      );
    }
    if (!price.bundleItemProductId) {
      errors.push(
        intl.formatMessage({
          id: 'product_bundle_import_item_id_required',
          defaultMessage: 'Required field bundleItemProductId missing',
        }),
      );
    }
  }

  for (const variation of variationsCSV) {
    if (!variation.productId) {
      errors.push(
        intl.formatMessage({
          id: 'product_variation_import_product_id_required',
          defaultMessage: 'Required field variation productId missing',
        }),
      );
    }
    if (!variation.variationId) {
      errors.push(
        intl.formatMessage({
          id: 'product_variation_import_variation_id_required',
          defaultMessage: 'Required field variationId missing',
        }),
      );
    }
    if (!variation.type) {
      errors.push(
        intl.formatMessage({
          id: 'product_variation_import_type_required',
          defaultMessage: 'Required field variation type missing',
        }),
      );
    }

    if (
      variation.type &&
      ![IProductVariationType.Color, IProductVariationType.Text].includes(
        variation.type,
      )
    ) {
      errors.push(
        intl.formatMessage(
          {
            id: 'product_variation_import_invalid_type_required',
            defaultMessage: 'Invalid variation type given {{}}',
          },
          { type: variation.type },
        ),
      );
    }
  }

  for (const variationOption of variationOptionsCSV) {
    if (!variationOption.variationId) {
      errors.push(
        intl.formatMessage({
          id: 'product_variation_option_import_variation_id_required',
          defaultMessage: 'Required field variation id missing',
        }),
      );
    }
    if (!variationOption.value) {
      errors.push(
        intl.formatMessage({
          id: 'product_variation_option_import_value_required',
          defaultMessage: 'Required field variation option value missing',
        }),
      );
    }
  }

  return errors;
};

const buildProductEvents = ({
  variations = [],
  ...product
}: BuildProductEventsParam) => {
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
        commerce: product.commerce ? { pricing: product.commerce } : undefined,
        bundleItems: product?.bundleItems,
      },
      variations: variations?.length ? variations : undefined,
    },
  };
};

const usePrepareProductImport = () => {
  const prepareProductImport = async ({
    productsCSV,
    pricesCSV,
    bundleItemsCSV,
    variationsCSV,
    variationOptionsCSV,
  }: ProductImportPayload) => {
    return (productsCSV || []).map((product) => {
      const prices = (pricesCSV || []).filter(
        (option) => option['productId'] === product._id,
      );
      const bundles = (bundleItemsCSV || []).filter(
        (item) => item['productId'] === product._id,
      );

      const productVariations = (variationsCSV || []).filter(
        (item) => item['productId'] === product._id,
      );
      let price = undefined;
      let bundleItems = undefined;
      let variations = undefined;
      if (prices.length)
        price = prices.map(
          ({ amount, maxQuantity, isNetPrice, isTaxable, ...restPrice }) => ({
            ...restPrice,
            amount: parseInt(amount) ?? 0,
            isNetPrice: isNetPrice === 'true',
            isTaxable: isTaxable === 'true',
            maxQuantity: parseInt(maxQuantity, 2) || 0,
          }),
        );

      if (bundles.length)
        bundleItems = bundles.map(
          ({ bundleItemProductId, quantity, configuration }) => ({
            productId: bundleItemProductId,
            quantity: Number(quantity || 1),
            configuration: (configuration || '').split(';').map((v) => {
              const [key, value] = v.split(':');
              return { key, value };
            }),
          }),
        );
      if (productVariations.length)
        variations = productVariations.map(
          ({ variationId, type, key, configuration, ...row }) => ({
            variationId,
            key,
            type,
            content: normalizeContent(row),
            options: (variationOptionsCSV || [])
              .filter((o) => o.variationId === variationId)
              .map((o) => ({
                value: o?.value ?? '',
                content: normalizeContent(o),
              })),
          }),
        );
      return buildProductEvents({
        ...productMapper(product),
        commerce: price,
        bundleItems,
        variations,
      });
    });
  };
  return { prepareProductImport };
};

export default usePrepareProductImport;
